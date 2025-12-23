import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { calculateCashbackForTrade } from '@/lib/utils/broker-cashback';

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET() {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = createServiceRoleClient();

    const now = new Date();
    const from30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // KPI: total users
    const { count: totalUsers, error: usersCountError } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (usersCountError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: usersCountError.message },
        { status: 500 }
      );
    }

    // KPI: accounts
    const { count: totalAccounts, error: accountsCountError } = await supabaseAdmin
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

    // Withdrawals stats (pending)
    const { data: pendingWithdrawals, error: pendingError } = await supabaseAdmin
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

    // Trades (30d) with broker to compute cashback
    const { data: trades30d, error: tradesError } = await supabaseAdmin
      .from('trades')
      .select(
        `
        close_time,
        lots,
        symbol,
        trading_accounts(broker)
      `
      )
      .gte('close_time', from30d.toISOString())
      .order('close_time', { ascending: true });

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

    const cashbackByDay = new Map<string, number>();
    for (const day of days) cashbackByDay.set(day, 0);

    for (const t of trades30d ?? []) {
      const close = new Date((t as any).close_time);
      const day = isoDay(startOfUtcDay(close));
      const lots = parseFloat((t as any).lots?.toString?.() ?? '0');
      const symbol = String((t as any).symbol ?? 'EURUSD');
      const broker =
        (t as any).trading_accounts?.broker ||
        (t as any).trading_accounts?.[0]?.broker ||
        'Unknown';
      const cashback = calculateCashbackForTrade(String(broker), symbol, lots);
      cashbackByDay.set(day, (cashbackByDay.get(day) ?? 0) + cashback);
    }

    const cashbackTotal30d = Array.from(cashbackByDay.values()).reduce(
      (a, b) => a + b,
      0
    );

    // Forecast: avg daily cashback over last 14d => next 7d
    const cashbackLast14d = days
      .filter((d) => d >= isoDay(startOfUtcDay(from14d)))
      .map((d) => cashbackByDay.get(d) ?? 0);
    const avg14d =
      cashbackLast14d.length > 0
        ? cashbackLast14d.reduce((a, b) => a + b, 0) / cashbackLast14d.length
        : 0;

    const forecastDays: string[] = [];
    for (let i = 1; i <= 7; i++) {
      forecastDays.push(isoDay(addDays(startOfUtcDay(now), i)));
    }

    const forecastByDay = new Map<string, number>();
    for (const d of forecastDays) forecastByDay.set(d, avg14d);

    // Withdrawals time series (30d)
    const { data: withdrawals30d, error: withdrawalsError } = await supabaseAdmin
      .from('withdrawals')
      .select('requested_at, processed_at, status, amount')
      .gte('requested_at', from30d.toISOString())
      .order('requested_at', { ascending: true });

    if (withdrawalsError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: withdrawalsError.message },
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
      const requested = isoDay(startOfUtcDay(new Date((w as any).requested_at)));
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
      cashback: Number((cashbackByDay.get(d) ?? 0).toFixed(2)),
      withdrawalsRequested: withdrawalsRequestedByDay.get(d) ?? 0,
      withdrawalsCompleted: withdrawalsCompletedByDay.get(d) ?? 0
    }));

    const forecastSeries = forecastDays.map((d) => ({
      day: d,
      cashbackForecast: Number((forecastByDay.get(d) ?? 0).toFixed(2))
    }));

    return NextResponse.json(
      {
        kpis: {
          totalUsers: totalUsers ?? 0,
          totalAccounts: totalAccounts ?? 0,
          connectedAccounts: connectedAccounts ?? 0,
          tradesLast30d: tradesCount30d,
          cashbackLast30d: Number(cashbackTotal30d.toFixed(2)),
          pendingWithdrawalsCount,
          pendingWithdrawalsAmount: Number(pendingWithdrawalsAmount.toFixed(2))
        },
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

