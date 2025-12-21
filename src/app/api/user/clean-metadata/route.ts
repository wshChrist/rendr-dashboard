import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Route API pour nettoyer les métadonnées utilisateur qui contiennent des base64 trop grandes
 * Cette route utilise le service role pour contourner RLS et nettoyer les métadonnées
 *
 * Usage: POST /api/user/clean-metadata
 * Body: { email: "user@example.com" } ou { userId: "uuid" }
 *
 * Protection: Utilise le service role key (déjà protégé côté serveur)
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

    const supabase = createServiceRoleClient();

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
          console.error(
            'Erreur lors de la récupération des utilisateurs:',
            listError
          );
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
        console.error(
          "Erreur lors de la récupération de l'utilisateur:",
          getUserError
        );
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

    // Vérifier si avatar_url contient une base64 (commence par "data:image")
    const metadata = user.user_metadata || {};
    const avatarUrl = metadata.avatar_url || '';

    // Si avatar_url est une base64 (commence par "data:image") ou est très long (> 1000 caractères)
    // on le supprime pour éviter les problèmes de taille de headers
    const needsCleanup =
      (avatarUrl && avatarUrl.startsWith('data:image')) ||
      (avatarUrl && avatarUrl.length > 1000);

    if (!needsCleanup) {
      return NextResponse.json(
        {
          success: true,
          message: 'Aucun nettoyage nécessaire',
          metadata: metadata
        },
        { status: 200 }
      );
    }

    // Nettoyer les métadonnées en supprimant avatar_url si c'est une base64
    const { avatar_url, ...cleanedMetadata } = metadata;

    // Mettre à jour les métadonnées utilisateur
    const { data: updatedUser, error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: cleanedMetadata
      });

    if (updateError) {
      console.error(
        'Erreur lors de la mise à jour des métadonnées:',
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
        message: 'Métadonnées nettoyées avec succès',
        userId: user.id,
        email: user.email,
        cleanedFields: ['avatar_url']
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors du nettoyage des métadonnées:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}

/**
 * Route GET pour vérifier l'état des métadonnées (debug uniquement)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email ou userId requis en paramètre de requête' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Récupérer l'utilisateur
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

    const metadata = user.user_metadata || {};
    const avatarUrl = metadata.avatar_url || '';

    const needsCleanup =
      (avatarUrl && avatarUrl.startsWith('data:image')) ||
      (avatarUrl && avatarUrl.length > 1000);

    return NextResponse.json(
      {
        userId: user.id,
        email: user.email,
        metadata: {
          ...metadata,
          avatar_url: avatarUrl
            ? `${avatarUrl.substring(0, 50)}... (${avatarUrl.length} caractères)`
            : null
        },
        needsCleanup: needsCleanup,
        avatarUrlLength: avatarUrl.length
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la vérification des métadonnées:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
