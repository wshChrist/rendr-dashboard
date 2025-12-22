import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Détermine l'URL de base pour les liens de parrainage
 */
function getBaseUrl(request: NextRequest): string {
  // Si NEXT_PUBLIC_APP_URL est défini et n'est pas localhost, l'utiliser
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // Sinon, construire l'URL à partir de la requête
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';

  if (host) {
    // En production, utiliser https (sauf si explicitement en développement)
    const isDevelopment =
      host.includes('localhost') || host.includes('127.0.0.1');
    return isDevelopment ? `http://${host}` : `${protocol}://${host}`;
  }

  // Fallback
  return envUrl || 'https://rendr.io';
}

/**
 * Route API pour récupérer les données de parrainage de l'utilisateur
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

    // Récupérer le code de parrainage de l'utilisateur
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('user_id', user.id)
      .single();

    // Si le code n'existe pas, retourner null pour indiquer qu'il doit être créé
    let referralCode: string | null = null;
    if (referralError || !referral) {
      // Code non trouvé - l'utilisateur doit en créer un
      referralCode = null;
    } else {
      referralCode = referral.referral_code || null;
    }

    // Générer le lien de parrainage (seulement si le code existe)
    const baseUrl = getBaseUrl(request);
    const referralLink = referralCode
      ? `${baseUrl}/auth/sign-up?ref=${referralCode}`
      : '';

    // Récupérer les statistiques de parrainage
    // Nombre total de filleuls
    const { count: totalReferralsCount, error: totalError } = await supabase
      .from('referral_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id);

    if (totalError) {
      console.error('Erreur lors du comptage des filleuls:', totalError);
    }

    // Récupérer tous les filleuls
    const { data: allReferrals, error: activeError } = await supabase
      .from('referral_relationships')
      .select('referred_id')
      .eq('referrer_id', user.id);

    if (activeError) {
      console.error(
        'Erreur lors de la récupération des filleuls:',
        activeError
      );
    }

    // Compter les filleuls actifs (ceux qui ont au moins un compte de trading connecté)
    const activeReferralIds = allReferrals?.map((r) => r.referred_id) || [];

    let activeCount = 0;
    if (activeReferralIds.length > 0) {
      // Récupérer les utilisateurs qui ont au moins un compte connecté
      const { data: accounts } = await supabase
        .from('trading_accounts')
        .select('user_id')
        .in('user_id', activeReferralIds)
        .eq('status', 'connected');

      // Compter les IDs uniques
      if (accounts && accounts.length > 0) {
        const uniqueUserIds = new Set(accounts.map((a) => a.user_id));
        activeCount = uniqueUserIds.size;
      }
    }

    // Calculer les gains totaux de parrainage
    const { data: earnings, error: earningsError } = await supabase
      .from('referral_earnings')
      .select('commission_amount, status')
      .eq('referrer_id', user.id);

    if (earningsError) {
      console.error('Erreur lors de la récupération des gains:', earningsError);
    }

    const totalEarnings =
      earnings?.reduce(
        (sum, e) => sum + parseFloat(e.commission_amount.toString()),
        0
      ) || 0;

    const pendingEarnings =
      earnings
        ?.filter((e) => e.status === 'pending')
        .reduce(
          (sum, e) => sum + parseFloat(e.commission_amount.toString()),
          0
        ) || 0;

    // Taux de commission (par défaut 10%, peut être configuré par utilisateur)
    const commissionRate = 10; // TODO: Rendre ce taux configurable

    return NextResponse.json(
      {
        code: referralCode,
        link: referralLink,
        totalReferrals: totalReferralsCount || 0,
        activeReferrals: activeCount,
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
        commissionRate
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      'Erreur lors de la récupération des données de parrainage:',
      error
    );
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
