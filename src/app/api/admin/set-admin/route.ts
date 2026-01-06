import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Route API pour définir un utilisateur comme administrateur
 *
 * Usage: POST /api/admin/set-admin
 * Body: { email: "user@example.com" } ou { userId: "uuid" }
 *
 * ⚠️ Cette route utilise le service role et doit être protégée en production
 * Recommandation: Ajouter une vérification supplémentaire (token secret, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email ou userId requis' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createServiceRoleClient();
    } catch (error: any) {
      console.error('Erreur lors de la création du client Supabase:', error);
      return NextResponse.json(
        {
          error: 'Configuration manquante',
          message:
            error.message ||
            "La variable SUPABASE_SERVICE_ROLE_KEY est manquante dans votre fichier .env.local. Consultez la documentation pour plus d'informations."
        },
        { status: 500 }
      );
    }

    // Récupérer l'utilisateur par email ou userId
    let user;
    if (email) {
      // Lister les utilisateurs avec pagination pour trouver celui avec l'email
      let found = false;
      let page = 1;
      const perPage = 1000;

      while (!found) {
        const { data, error: listError } = await supabase.auth.admin.listUsers({
          page,
          perPage
        });

        if (listError) {
          return NextResponse.json(
            { error: 'Erreur serveur', message: listError.message },
            { status: 500 }
          );
        }

        user = data.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (user || data.users.length < perPage) {
          found = true;
        } else {
          page++;
        }
      }
    } else if (userId) {
      const { data: userData, error: getUserError } =
        await supabase.auth.admin.getUserById(userId);
      if (getUserError) {
        return NextResponse.json(
          { error: 'Erreur serveur', message: getUserError.message },
          { status: 500 }
        );
      }
      user = userData.user;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour les métadonnées pour ajouter le rôle admin
    const currentMetadata = user.user_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      role: 'admin'
    };

    const { data: updatedUser, error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: updatedMetadata
      });

    if (updateError) {
      console.error(
        'Erreur lors de la mise à jour du rôle admin:',
        updateError
      );
      return NextResponse.json(
        { error: 'Erreur serveur', message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Rôle admin défini avec succès',
        userId: user.id,
        email: user.email,
        role: 'admin'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la définition du rôle admin:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
