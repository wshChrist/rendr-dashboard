import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  calculateCashbackForTrade,
  calculateRendREarnings
} from '@/lib/utils/broker-cashback';

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export async function GET() {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = createServiceRoleClient();

    const now = new Date();
    const from30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const from7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // KPI: total users
    const { count: totalUsers, error: usersCountError } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (usersCountError) {
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: usersCountError.message
        },
        { status: 500 }
      );
    }

    // KPI: accounts
    const { count: totalAccounts, error: accountsCountError } =
      await supabaseAdmin
        .from('trading_accounts')
        .select('id', { count: 'exact', head: true });

    if (accountsCountError) {
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: accountsCountError.message
        },
        { status: 500 }
      );
    }

    const { count: connectedAccounts, error: connectedCountError } =
      await supabaseAdmin
        .from('trading_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'connected');

    if (connectedCountError) {
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: connectedCountError.message
        },
        { status: 500 }
      );
    }

    // Comptes en erreur et pending
    const { count: errorAccounts, error: errorCountError } = await supabaseAdmin
      .from('trading_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'error');

    const { count: pendingAccounts, error: pendingCountError } =
      await supabaseAdmin
        .from('trading_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_vps_setup');

    // Stats par broker
    const { data: accountsByBroker, error: brokerStatsError } =
      await supabaseAdmin.from('trading_accounts').select('broker, status');

    const brokerStats = new Map<
      string,
      { total: number; connected: number; error: number; pending: number }
    >();
    for (const acc of accountsByBroker ?? []) {
      const broker = String(acc.broker || 'Unknown');
      if (!brokerStats.has(broker)) {
        brokerStats.set(broker, {
          total: 0,
          connected: 0,
          error: 0,
          pending: 0
        });
      }
      const stats = brokerStats.get(broker)!;
      stats.total++;
      if (acc.status === 'connected') stats.connected++;
      else if (acc.status === 'error') stats.error++;
      else if (acc.status === 'pending_vps_setup') stats.pending++;
    }

    // Withdrawals stats (pending)
    const { data: pendingWithdrawals, error: pendingError } =
      await supabaseAdmin
        .from('withdrawals')
        .select('amount,status')
        .in('status', ['pending', 'processing']);

    if (pendingError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: pendingError.message },
        { status: 500 }
      );
    }

    const pendingWithdrawalsCount = pendingWithdrawals?.length ?? 0;
    const pendingWithdrawalsAmount =
      pendingWithdrawals?.reduce(
        (sum, w: any) => sum + parseFloat(w.amount?.toString?.() ?? '0'),
        0
      ) ?? 0;

    // Trades (30d) with broker and user_id to check referrals
    const { data: trades30d, error: tradesError } = await supabaseAdmin
      .from('trades')
      .select(
        `
        id,
        close_time,
        lots,
        symbol,
        trading_accounts(broker, user_id)
      `
      )
      .gte('close_time', from30d.toISOString())
      .order('close_time', { ascending: true });

    // Récupérer toutes les relations de parrainage actives pour vérifier les referrals
    const { data: activeReferrals, error: referralsError } = await supabaseAdmin
      .from('referral_relationships')
      .select('referred_id, referrer_id')
      .eq('status', 'active');

    const referralUserIds = new Set(
      activeReferrals?.map((r) => r.referred_id) || []
    );

    // Map pour trouver rapidement le referrer_id d'un referred_id
    const referralMap = new Map<string, string>();
    activeReferrals?.forEach((r) => {
      referralMap.set(r.referred_id, r.referrer_id);
    });

    // Récupérer les commissions de parrainage déjà payées (pour les soustraire des profits)
    const { data: referralEarnings30d, error: referralEarningsError } =
      await supabaseAdmin
        .from('referral_earnings')
        .select('trade_id, commission_amount')
        .gte('created_at', from30d.toISOString());

    const referralEarningsByTrade = new Map<string, number>();
    referralEarnings30d?.forEach((e) => {
      if (e.trade_id) {
        referralEarningsByTrade.set(
          e.trade_id,
          (referralEarningsByTrade.get(e.trade_id) ?? 0) +
            parseFloat(e.commission_amount?.toString() ?? '0')
        );
      }
    });

    if (tradesError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: tradesError.message },
        { status: 500 }
      );
    }

    const tradesCount30d = trades30d?.length ?? 0;

    // Build 30d daily skeleton
    const days: string[] = [];
    const start = startOfUtcDay(from30d);
    const end = startOfUtcDay(now);
    for (let d = start; d <= end; d = addDays(d, 1)) {
      days.push(isoDay(d));
    }

    const revenueByDay = new Map<string, number>();
    const cashbackByDay = new Map<string, number>();
    const profitByDay = new Map<string, number>();
    for (const day of days) {
      revenueByDay.set(day, 0);
      cashbackByDay.set(day, 0);
      profitByDay.set(day, 0);
    }

    let totalVolume30d = 0;
    const volumeByBroker = new Map<string, number>();
    const revenueByBroker = new Map<string, number>();
    const cashbackByBroker = new Map<string, number>();
    const profitByBroker = new Map<string, number>();
    const referralCommissionByBroker = new Map<string, number>();

    for (const t of trades30d ?? []) {
      const close = new Date((t as any).close_time);
      const day = isoDay(startOfUtcDay(close));
      const lots = parseFloat((t as any).lots?.toString?.() ?? '0');
      const symbol = String((t as any).symbol ?? 'EURUSD');
      const tradeId = (t as any).id;
      const broker =
        (t as any).trading_accounts?.broker ||
        (t as any).trading_accounts?.[0]?.broker ||
        'Unknown';
      const userId =
        (t as any).trading_accounts?.user_id ||
        (t as any).trading_accounts?.[0]?.user_id ||
        null;

      // Revenus de RendR (ce que le broker paie)
      const revenue = calculateRendREarnings(String(broker), symbol, lots);

      // Vérifier si c'est un referral
      const isReferral = userId && referralUserIds.has(userId);

      // Calcul selon le modèle :
      // - Si referral : RendR prend 30%, trader reçoit 50%, parrain reçoit 20%
      // - Si pas referral : RendR prend 50%, trader reçoit 50%
      const rendRShare = isReferral ? 0.3 : 0.5;
      const traderShare = isReferral ? 0.5 : 0.5;
      const referralShare = isReferral ? 0.2 : 0;

      // Cashback donné au trader
      const cashback = revenue * traderShare;
      // Commission du parrain (20% si referral)
      const referralCommission = revenue * referralShare;
      // Profit de RendR (30% si referral, 50% sinon)
      const profit = revenue * rendRShare;

      revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + revenue);
      cashbackByDay.set(day, (cashbackByDay.get(day) ?? 0) + cashback);
      profitByDay.set(day, (profitByDay.get(day) ?? 0) + profit);

      // Volume total
      totalVolume30d += lots;

      // Par broker
      volumeByBroker.set(broker, (volumeByBroker.get(broker) ?? 0) + lots);
      revenueByBroker.set(broker, (revenueByBroker.get(broker) ?? 0) + revenue);
      cashbackByBroker.set(
        broker,
        (cashbackByBroker.get(broker) ?? 0) + cashback
      );
      profitByBroker.set(broker, (profitByBroker.get(broker) ?? 0) + profit);
      if (isReferral) {
        referralCommissionByBroker.set(
          broker,
          (referralCommissionByBroker.get(broker) ?? 0) + referralCommission
        );
      }
    }

    const revenueTotal30d = Array.from(revenueByDay.values()).reduce(
      (a, b) => a + b,
      0
    );
    const cashbackTotal30d = Array.from(cashbackByDay.values()).reduce(
      (a, b) => a + b,
      0
    );
    const profitTotal30d = revenueTotal30d - cashbackTotal30d;

    // Stats 7 derniers jours pour comparaison
    const revenueLast7d = days
      .filter((d) => d >= isoDay(startOfUtcDay(from7d)))
      .map((d) => revenueByDay.get(d) ?? 0)
      .reduce((a, b) => a + b, 0);
    const cashbackLast7d = days
      .filter((d) => d >= isoDay(startOfUtcDay(from7d)))
      .map((d) => cashbackByDay.get(d) ?? 0)
      .reduce((a, b) => a + b, 0);
    const profitLast7d = revenueLast7d - cashbackLast7d;

    // Stats 30-60 jours pour tendance
    const { data: trades60d, error: trades60dError } = await supabaseAdmin
      .from('trades')
      .select('close_time, lots, symbol, trading_accounts(broker, user_id)')
      .gte('close_time', from60d.toISOString())
      .lt('close_time', from30d.toISOString());

    let revenuePrevious30d = 0;
    let cashbackPrevious30d = 0;
    let profitPrevious30d = 0;
    if (!trades60dError && trades60d) {
      for (const t of trades60d) {
        const lots = parseFloat((t as any).lots?.toString?.() ?? '0');
        const symbol = String((t as any).symbol ?? 'EURUSD');
        const broker =
          (t as any).trading_accounts?.broker ||
          (t as any).trading_accounts?.[0]?.broker ||
          'Unknown';
        const userId =
          (t as any).trading_accounts?.user_id ||
          (t as any).trading_accounts?.[0]?.user_id ||
          null;

        const revenue = calculateRendREarnings(String(broker), symbol, lots);
        const isReferral = userId && referralUserIds.has(userId);
        const rendRShare = isReferral ? 0.3 : 0.5;
        const traderShare = isReferral ? 0.5 : 0.5;

        const cashback = revenue * traderShare;
        const profit = revenue * rendRShare;

        revenuePrevious30d += revenue;
        cashbackPrevious30d += cashback;
        profitPrevious30d += profit;
      }
    }

    // Taux de croissance des profits
    const profitGrowthRate =
      profitPrevious30d > 0
        ? ((profitTotal30d - profitPrevious30d) / profitPrevious30d) * 100
        : 0;

    // Forecast: avg daily profit over last 14d => next 7d
    const profitLast14d = days
      .filter((d) => d >= isoDay(startOfUtcDay(from14d)))
      .map((d) => profitByDay.get(d) ?? 0);
    const avgProfit14d =
      profitLast14d.length > 0
        ? profitLast14d.reduce((a, b) => a + b, 0) / profitLast14d.length
        : 0;

    const forecastDays: string[] = [];
    for (let i = 1; i <= 7; i++) {
      forecastDays.push(isoDay(addDays(startOfUtcDay(now), i)));
    }

    const forecastByDay = new Map<string, number>();
    for (const d of forecastDays) forecastByDay.set(d, avgProfit14d);

    // Withdrawals time series (30d)
    const { data: withdrawals30d, error: withdrawalsError } =
      await supabaseAdmin
        .from('withdrawals')
        .select('requested_at, processed_at, status, amount')
        .gte('requested_at', from30d.toISOString())
        .order('requested_at', { ascending: true });

    if (withdrawalsError) {
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: withdrawalsError.message
        },
        { status: 500 }
      );
    }

    const withdrawalsRequestedByDay = new Map<string, number>();
    const withdrawalsCompletedByDay = new Map<string, number>();
    for (const d of days) {
      withdrawalsRequestedByDay.set(d, 0);
      withdrawalsCompletedByDay.set(d, 0);
    }
    for (const w of withdrawals30d ?? []) {
      const requested = isoDay(
        startOfUtcDay(new Date((w as any).requested_at))
      );
      withdrawalsRequestedByDay.set(
        requested,
        (withdrawalsRequestedByDay.get(requested) ?? 0) + 1
      );
      if ((w as any).status === 'completed' && (w as any).processed_at) {
        const processed = isoDay(
          startOfUtcDay(new Date((w as any).processed_at))
        );
        withdrawalsCompletedByDay.set(
          processed,
          (withdrawalsCompletedByDay.get(processed) ?? 0) + 1
        );
      }
    }

    const series = days.map((d) => ({
      day: d,
      revenue: Number((revenueByDay.get(d) ?? 0).toFixed(2)),
      profit: Number((profitByDay.get(d) ?? 0).toFixed(2)),
      cashback: Number((cashbackByDay.get(d) ?? 0).toFixed(2)),
      withdrawalsRequested: withdrawalsRequestedByDay.get(d) ?? 0,
      withdrawalsCompleted: withdrawalsCompletedByDay.get(d) ?? 0
    }));

    const forecastSeries = forecastDays.map((d) => ({
      day: d,
      profitForecast: Number((forecastByDay.get(d) ?? 0).toFixed(2))
    }));

    return NextResponse.json(
      {
        kpis: {
          totalUsers: totalUsers ?? 0,
          totalAccounts: totalAccounts ?? 0,
          connectedAccounts: connectedAccounts ?? 0,
          errorAccounts: errorAccounts ?? 0,
          pendingAccounts: pendingAccounts ?? 0,
          tradesLast30d: tradesCount30d,
          revenueLast30d: Number(revenueTotal30d.toFixed(2)),
          cashbackLast30d: Number(cashbackTotal30d.toFixed(2)),
          profitLast30d: Number(profitTotal30d.toFixed(2)),
          profitLast7d: Number(profitLast7d.toFixed(2)),
          profitGrowthRate: Number(profitGrowthRate.toFixed(2)),
          totalVolume30d: Number(totalVolume30d.toFixed(2)),
          pendingWithdrawalsCount,
          pendingWithdrawalsAmount: Number(pendingWithdrawalsAmount.toFixed(2))
        },
        brokerStats: Array.from(brokerStats.entries()).map(
          ([broker, stats]) => ({
            broker,
            ...stats,
            volume: Number((volumeByBroker.get(broker) ?? 0).toFixed(2)),
            revenue: Number((revenueByBroker.get(broker) ?? 0).toFixed(2)),
            cashback: Number((cashbackByBroker.get(broker) ?? 0).toFixed(2)),
            profit: Number((profitByBroker.get(broker) ?? 0).toFixed(2)),
            referralCommission: Number(
              (referralCommissionByBroker.get(broker) ?? 0).toFixed(2)
            )
          })
        ),
        series,
        forecastSeries
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error?.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
