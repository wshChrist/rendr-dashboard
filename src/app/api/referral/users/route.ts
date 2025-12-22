import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Route API pour récupérer la liste des filleuls de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
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

    // Récupérer les relations de parrainage
    const { data: relationships, error: relationshipsError } = await supabase
      .from('referral_relationships')
      .select('referred_id, status, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (relationshipsError) {
      console.error(
        'Erreur lors de la récupération des filleuls:',
        relationshipsError
      );
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: relationshipsError.message
        },
        { status: 500 }
      );
    }

    if (!relationships || relationships.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Récupérer les informations des utilisateurs parrainés
    const referredIds = relationships.map((r) => r.referred_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .in('id', referredIds);

    if (usersError) {
      console.error(
        'Erreur lors de la récupération des utilisateurs:',
        usersError
      );
      return NextResponse.json(
        { error: 'Erreur de base de données', message: usersError.message },
        { status: 500 }
      );
    }

    // Vérifier quels filleuls ont des comptes de trading connectés (actifs)
    const { data: activeAccounts } = await supabase
      .from('trading_accounts')
      .select('user_id')
      .in('user_id', referredIds)
      .eq('status', 'connected');

    const activeUserIds = new Set(activeAccounts?.map((a) => a.user_id) || []);

    // Calculer les gains pour chaque filleul
    const { data: earnings, error: earningsError } = await supabase
      .from('referral_earnings')
      .select('referred_id, commission_amount')
      .eq('referrer_id', user.id);

    if (earningsError) {
      console.error('Erreur lors de la récupération des gains:', earningsError);
    }

    // Grouper les gains par filleul
    const earningsByUser = new Map<string, number>();
    earnings?.forEach((e) => {
      const userId = e.referred_id;
      const amount = parseFloat(e.commission_amount.toString());
      earningsByUser.set(userId, (earningsByUser.get(userId) || 0) + amount);
    });

    // Construire la réponse avec les données formatées
    const referredUsers = relationships.map((relationship) => {
      const userData = users?.find((u) => u.id === relationship.referred_id);

      // Déterminer le statut : actif si l'utilisateur a au moins un compte connecté
      const isActive = activeUserIds.has(relationship.referred_id);
      const status = isActive ? 'active' : relationship.status;

      // Générer un nom d'affichage (première lettre du prénom + initiale du nom)
      let displayName = 'Utilisateur';
      if (userData?.name) {
        const nameParts = userData.name.split(' ');
        if (nameParts.length >= 2) {
          displayName = `${nameParts[0]} ${nameParts[1].charAt(0)}.`;
        } else {
          displayName = userData.name;
        }
      } else if (userData?.email) {
        displayName = userData.email.split('@')[0];
      }

      return {
        id: relationship.referred_id,
        name: displayName,
        joined: relationship.created_at,
        status: status as 'active' | 'pending',
        earnings: parseFloat(
          (earningsByUser.get(relationship.referred_id) || 0).toFixed(2)
        )
      };
    });

    return NextResponse.json(referredUsers, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des filleuls:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
