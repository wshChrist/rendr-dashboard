'use client';

import * as React from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';

type AdminOverviewResponse = {
  kpis: {
    totalUsers: number;
    totalAccounts: number;
    connectedAccounts: number;
    tradesLast30d: number;
    cashbackLast30d: number;
    pendingWithdrawalsCount: number;
    pendingWithdrawalsAmount: number;
  };
  series: Array<{
    day: string;
    cashback: number;
    withdrawalsRequested: number;
    withdrawalsCompleted: number;
  }>;
  forecastSeries: Array<{ day: string; cashbackForecast: number }>;
};

async function fetchOverview(): Promise<AdminOverviewResponse> {
  const res = await fetch('/api/admin/overview');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors du chargement');
  }
  return json as AdminOverviewResponse;
}

export function AdminOverviewView() {
  const t = useTranslations();
  const [data, setData] = React.useState<AdminOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await fetchOverview());
    } catch (e: any) {
      toast.error('Impossible de charger les statistiques', {
        description: e?.message
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const mergedSeries = React.useMemo(() => {
    if (!data) return [];
    const forecastMap = new Map(
      data.forecastSeries.map((x) => [x.day, x.cashbackForecast])
    );
    return [
      ...data.series.map((x) => ({
        ...x,
        cashbackForecast: null as number | null
      })),
      ...data.forecastSeries.map((x) => ({
        day: x.day,
        cashback: null as number | null,
        cashbackForecast: x.cashbackForecast,
        withdrawalsRequested: 0,
        withdrawalsCompleted: 0
      }))
    ].map((row) => ({
      ...row,
      cashbackForecast: row.cashbackForecast ?? forecastMap.get(row.day) ?? null
    }));
  }, [data]);

  const chartConfig = React.useMemo<ChartConfig>(
    () => ({
      cashback: { label: t('stats.totalCashback'), color: '#c5d13f' },
      cashbackForecast: { label: t('admin.cashbackForecast'), color: '#d4db5a' }
    }),
    []
  );

  if (isLoading || !data) {
    return (
      <div
        className={cn(
          'rounded-2xl p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5'
        )}
      >
        <p className='text-muted-foreground text-sm'>Chargement…</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* KPIs */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <p className='text-muted-foreground text-sm'>Utilisateurs</p>
          <p className='stat-number text-3xl font-bold'>
            {data.kpis.totalUsers}
          </p>
          <p className='text-muted-foreground/70 text-xs'>
            Comptes: {data.kpis.totalAccounts} (connectés:{' '}
            {data.kpis.connectedAccounts})
          </p>
        </div>
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <p className='text-muted-foreground text-sm'>Trades (30j)</p>
          <p className='stat-number text-3xl font-bold'>
            {data.kpis.tradesLast30d}
          </p>
          <p className='text-muted-foreground/70 text-xs'>
            Volume & cashback agrégés (voir graphique)
          </p>
        </div>
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-[#c5d13f]/20'
          )}
        >
          <p className='text-muted-foreground text-sm'>
            {t('admin.cashback30d')}
          </p>
          <p className='stat-number text-3xl font-bold text-[#c5d13f]'>
            {data.kpis.cashbackLast30d.toFixed(2)}€
          </p>
          <p className='text-muted-foreground/70 text-xs'>
            {t('admin.calculatedFromTrades')}
          </p>
        </div>
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <p className='text-muted-foreground text-sm'>
            {t('admin.overview.pendingWithdrawals')}
          </p>
          <p className='stat-number text-3xl font-bold'>
            {data.kpis.pendingWithdrawalsCount}
          </p>
          <p className='text-muted-foreground/70 text-xs'>
            {t('admin.amount')}: {data.kpis.pendingWithdrawalsAmount.toFixed(2)}
            €
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div
          className={cn(
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>
              {t('admin.cashback30dForecast')}
            </h3>
            <p className='text-muted-foreground text-sm'>
              {t('admin.forecastDescription')}
            </p>
          </div>
          <ChartContainer config={chartConfig} className='h-[220px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={mergedSeries}>
                <CartesianGrid
                  vertical={false}
                  stroke='rgba(255,255,255,0.06)'
                />
                <XAxis dataKey='day' hide />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className='border-white/10 bg-zinc-900'
                      formatter={(value, name) => (
                        <span className='font-medium'>
                          {name}: {Number(value).toFixed(2)}€
                        </span>
                      )}
                    />
                  }
                />
                <Line
                  type='monotone'
                  dataKey='cashback'
                  stroke='var(--color-cashback)'
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type='monotone'
                  dataKey='cashbackForecast'
                  stroke='var(--color-cashbackForecast)'
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray='6 6'
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div
          className={cn(
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>
              {t('admin.withdrawals30d')}
            </h3>
            <p className='text-muted-foreground text-sm'>
              {t('admin.requestsVsCompleted')}
            </p>
          </div>
          <ChartContainer
            config={{
              withdrawalsRequested: {
                label: t('admin.requests'),
                color: '#c5d13f'
              },
              withdrawalsCompleted: {
                label: t('admin.completed'),
                color: '#a5b028'
              }
            }}
            className='h-[220px] w-full'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data.series}>
                <CartesianGrid
                  vertical={false}
                  stroke='rgba(255,255,255,0.06)'
                />
                <XAxis dataKey='day' hide />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className='border-white/10 bg-zinc-900' />
                  }
                />
                <Line
                  type='monotone'
                  dataKey='withdrawalsRequested'
                  stroke='var(--color-withdrawalsRequested)'
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type='monotone'
                  dataKey='withdrawalsCompleted'
                  stroke='var(--color-withdrawalsCompleted)'
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
