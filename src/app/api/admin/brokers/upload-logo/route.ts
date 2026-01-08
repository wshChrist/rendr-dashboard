import { NextRequest, NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Upload un logo de broker vers Supabase Storage
 * POST /api/admin/brokers/upload-logo
 * FormData: { file: File }
 */
export async function POST(request: NextRequest) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier manquant', message: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        {
          error: 'Type de fichier invalide',
          message: 'Le fichier doit être une image'
        },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'Fichier trop volumineux',
          message: 'La taille maximale est de 5MB'
        },
        { status: 400 }
      );
    }

    // Créer un nom de fichier unique
    const fileExt = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;

    // Convertir le File en ArrayBuffer pour Supabase
    const arrayBuffer = await file.arrayBuffer();

    const supabaseAdmin = createServiceRoleClient();

    // Uploader vers Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('brokers')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      // Si le bucket n'existe pas, on retourne une erreur explicite
      if (
        error.message.includes('bucket') ||
        error.message.includes('not found')
      ) {
        return NextResponse.json(
          {
            error: 'Bucket non trouvé',
            message:
              'Le bucket "brokers" n\'existe pas dans Supabase Storage. Veuillez le créer dans votre dashboard Supabase.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Erreur lors de l'upload",
          message: error.message
        },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique du fichier
    const {
      data: { publicUrl }
    } = supabaseAdmin.storage.from('brokers').getPublicUrl(fileName);

    return NextResponse.json(
      {
        url: publicUrl,
        path: fileName
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'upload du logo:", error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error?.message || "Une erreur est survenue lors de l'upload"
      },
      { status: 500 }
    );
  }
}
