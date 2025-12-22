import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateCashbackForTrade } from '@/lib/utils/broker-cashback';

/**
 * Route API pour récupérer les statistiques de retraits (solde disponible, total retiré, etc.)
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

    // Récupérer les comptes de trading
    const { data: accounts } = await supabase
      .from('trading_accounts')
      .select('id, broker')
      .eq('user_id', user.id);

    let totalCashback = 0;
    let totalVolume = 0;
    let totalTrades = 0;

    if (accounts && accounts.length > 0) {
      const accountIds = accounts.map((a) => a.id);

      // Récupérer tous les trades
      const { data: trades } = await supabase
        .from('trades')
        .select('lots, commission, trading_account_id, symbol')
        .in('trading_account_id', accountIds);

      if (trades && accounts) {
        totalTrades = trades.length;
        trades.forEach((trade) => {
          const account = accounts.find(
            (a) => a.id === trade.trading_account_id
          );
          const brokerName =
            (account as { broker?: string })?.broker || 'Unknown';
          const lots = parseFloat(trade.lots || '0');
          const symbol = (trade as { symbol?: string })?.symbol || 'EURUSD';

          totalVolume += lots;
          const cashback = calculateCashbackForTrade(brokerName, symbol, lots);
          totalCashback += cashback;
        });
      }
    }

    // Récupérer les retraits
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount, status')
      .eq('user_id', user.id);

    // Calculer les totaux
    const completedWithdrawals =
      withdrawals?.filter((w) => w.status === 'completed') || [];
    const pendingWithdrawals =
      withdrawals?.filter(
        (w) => w.status === 'pending' || w.status === 'processing'
      ) || [];

    const totalWithdrawn = completedWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.amount.toString()),
      0
    );

    const pendingAmount = pendingWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.amount.toString()),
      0
    );

    const availableBalance = Math.max(0, totalCashback - totalWithdrawn);

    return NextResponse.json(
      {
        total_cashback_earned: totalCashback,
        available_balance: availableBalance,
        pending_cashback: 0, // Pour l'instant, tout est disponible
        total_withdrawn: totalWithdrawn,
        total_volume: totalVolume,
        total_trades: totalTrades,
        active_brokers: accounts?.length || 0,
        pending_withdrawals_count: pendingWithdrawals.length,
        pending_withdrawals_amount: pendingAmount,
        completed_withdrawals_count: completedWithdrawals.length
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
