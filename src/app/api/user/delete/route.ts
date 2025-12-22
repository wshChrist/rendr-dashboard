import { createServiceRoleClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Route API pour supprimer le compte utilisateur
 * Cette route utilise le service role pour supprimer l'utilisateur de Supabase
 *
 * Usage: DELETE /api/user/delete
 * Protection: Vérifie que l'utilisateur est authentifié et supprime uniquement son propre compte
 */
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé', message: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    // Utiliser le service role pour supprimer l'utilisateur
    const adminSupabase = createServiceRoleClient();

    // Supprimer l'utilisateur
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error('Erreur lors de la suppression du compte:', deleteError);
      return NextResponse.json(
        {
          error: 'Erreur serveur',
          message: deleteError.message || 'Impossible de supprimer le compte'
        },
        { status: 500 }
      );
    }

    // Déconnecter l'utilisateur
    await supabase.auth.signOut();

    return NextResponse.json(
      {
        success: true,
        message: 'Compte supprimé avec succès'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la suppression du compte:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
