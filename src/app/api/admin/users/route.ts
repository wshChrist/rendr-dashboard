import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = createServiceRoleClient();

    // Récupérer tous les utilisateurs avec leurs comptes de trading
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: usersError.message },
        { status: 500 }
      );
    }

    // Pour chaque utilisateur, récupérer ses comptes de trading (sans mots de passe)
    const usersWithAccounts = await Promise.all(
      (users || []).map(async (user) => {
        const { data: accounts, error: accountsError } = await supabaseAdmin
          .from('trading_accounts')
          .select(
            'id, broker, platform, server, login, status, created_at, external_account_id'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Récupérer les balances de cashback
        const { data: cashbackBalances, error: balancesError } =
          await supabaseAdmin
            .from('cashback_balances')
            .select('id, period, volume_lots, cashback_amount, status')
            .eq('user_id', user.id)
            .order('period', { ascending: false });

        // Calculer le total de cashback
        const totalCashback =
          cashbackBalances?.reduce(
            (sum, balance) =>
              sum + parseFloat(balance.cashback_amount?.toString() ?? '0'),
            0
          ) ?? 0;

        const pendingCashback =
          cashbackBalances
            ?.filter((b) => b.status === 'pending')
            .reduce(
              (sum, balance) =>
                sum + parseFloat(balance.cashback_amount?.toString() ?? '0'),
              0
            ) ?? 0;

        // Compter les trades
        const { count: tradesCount, error: tradesError } = await supabaseAdmin
          .from('trades')
          .select('id', { count: 'exact', head: true })
          .in('trading_account_id', accounts?.map((a) => a.id) || []);

        return {
          ...user,
          accounts: accounts || [],
          cashbackBalances: cashbackBalances || [],
          totalCashback: Number(totalCashback.toFixed(2)),
          pendingCashback: Number(pendingCashback.toFixed(2)),
          tradesCount: tradesCount || 0,
          accountsCount: accounts?.length || 0,
          connectedAccountsCount:
            accounts?.filter((a) => a.status === 'connected').length || 0
        };
      })
    );

    return NextResponse.json(usersWithAccounts, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
