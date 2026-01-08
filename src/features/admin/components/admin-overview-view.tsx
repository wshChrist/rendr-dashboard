'use client';

import * as React from 'react';
import {
  Line,
  LineChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
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
import {
  IconUsers,
  IconWallet,
  IconArrowsExchange,
  IconSparkles,
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
  IconBuildingBank
} from '@tabler/icons-react';

type AdminOverviewResponse = {
  kpis: {
    totalUsers: number;
    totalAccounts: number;
    connectedAccounts: number;
    errorAccounts: number;
    pendingAccounts: number;
    tradesLast30d: number;
    revenueLast30d: number;
    cashbackLast30d: number;
    profitLast30d: number;
    profitLast7d: number;
    profitGrowthRate: number;
    totalVolume30d: number;
    pendingWithdrawalsCount: number;
    pendingWithdrawalsAmount: number;
  };
  brokerStats: Array<{
    broker: string;
    total: number;
    connected: number;
    error: number;
    pending: number;
    volume: number;
    revenue: number;
    cashback: number;
    profit: number;
    referralCommission: number;
  }>;
  series: Array<{
    day: string;
    revenue: number;
    profit: number;
    cashback: number;
    withdrawalsRequested: number;
    withdrawalsCompleted: number;
  }>;
  forecastSeries: Array<{ day: string; profitForecast: number }>;
};

async function fetchOverview(): Promise<AdminOverviewResponse> {
  const res = await fetch('/api/admin/overview');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors du chargement');
  }
  return json as AdminOverviewResponse;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

function TrendIndicator({
  value,
  positive = true
}: {
  value: number;
  positive?: boolean;
}) {
  const isPositive = positive ? value >= 0 : value <= 0;
  const Icon = isPositive ? IconTrendingUp : IconTrendingDown;
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        isPositive ? 'text-green-400' : 'text-red-400'
      )}
    >
      <Icon className='h-3 w-3' />
      <span>
        {isPositive ? '+' : ''}
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function KPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  highlight
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { value: number; positive: boolean };
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-4 md:p-5',
        'bg-zinc-900/50 backdrop-blur-sm',
        'border transition-all duration-300',
        highlight
          ? 'border-[#c5d13f]/30 bg-[#c5d13f]/5'
          : 'border-white/5 hover:border-white/10',
        className
      )}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1 space-y-1'>
          <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
            {Icon && <Icon className='h-4 w-4' />}
            {label}
          </div>
          <div
            className={cn(
              'stat-number text-2xl font-bold md:text-3xl',
              highlight && 'text-[#c5d13f]'
            )}
          >
            {value}
          </div>
          {subtitle && (
            <div className='text-muted-foreground/70 text-xs'>{subtitle}</div>
          )}
        </div>
        {trend && (
          <div className='flex-shrink-0'>
            <TrendIndicator value={trend.value} positive={trend.positive} />
          </div>
        )}
      </div>
    </div>
  );
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
      data.forecastSeries.map((x) => [x.day, x.profitForecast])
    );
    return [
      ...data.series.map((x) => ({
        ...x,
        profitForecast: null as number | null
      })),
      ...data.forecastSeries.map((x) => ({
        day: x.day,
        profit: null as number | null,
        profitForecast: x.profitForecast,
        revenue: null as number | null,
        cashback: null as number | null,
        withdrawalsRequested: 0,
        withdrawalsCompleted: 0
      }))
    ].map((row) => ({
      ...row,
      profitForecast: row.profitForecast ?? forecastMap.get(row.day) ?? null
    }));
  }, [data]);

  const chartConfig = React.useMemo<ChartConfig>(
    () => ({
      profit: { label: 'Profits', color: '#10b981' },
      profitForecast: { label: 'Prévision profits', color: '#34d399' },
      revenue: { label: 'Revenus', color: '#3b82f6' },
      cashback: { label: 'Cashback donné', color: '#f59e0b' },
      withdrawalsRequested: { label: 'Demandés', color: '#f59e0b' },
      withdrawalsCompleted: { label: 'Complétés', color: '#10b981' }
    }),
    []
  );

  if (isLoading || !data) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className='h-32 animate-pulse rounded-xl bg-zinc-900/40'
            />
          ))}
        </div>
      </div>
    );
  }

  // Calculer les métriques dérivées
  const accountConnectionRate =
    data.kpis.totalAccounts > 0
      ? (data.kpis.connectedAccounts / data.kpis.totalAccounts) * 100
      : 0;

  const avgProfitPerTrade =
    data.kpis.tradesLast30d > 0
      ? data.kpis.profitLast30d / data.kpis.tradesLast30d
      : 0;

  const avgVolumePerTrade =
    data.kpis.tradesLast30d > 0
      ? data.kpis.totalVolume30d / data.kpis.tradesLast30d
      : 0;

  const profitMargin =
    data.kpis.revenueLast30d > 0
      ? (data.kpis.profitLast30d / data.kpis.revenueLast30d) * 100
      : 0;

  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Version Mobile : Colonnes organisées */}
      <div className='block space-y-3 md:hidden'>
        {/* Colonne 1 : Utilisateurs & Comptes */}
        <div className='grid grid-cols-2 gap-3'>
          <KPICard
            label='Utilisateurs'
            value={formatNumber(data.kpis.totalUsers)}
            subtitle={`${data.kpis.totalAccounts} comptes`}
            icon={IconUsers}
            className='col-span-2'
          />
          <KPICard
            label='Connectés'
            value={data.kpis.connectedAccounts}
            subtitle={`${accountConnectionRate.toFixed(1)}%`}
            icon={IconBuildingBank}
            trend={{
              value: accountConnectionRate,
              positive: accountConnectionRate >= 70
            }}
          />
          <KPICard
            label='En erreur'
            value={data.kpis.errorAccounts}
            subtitle={`${data.kpis.pendingAccounts} en attente`}
            icon={IconAlertTriangle}
            className={cn(
              data.kpis.errorAccounts > 0 && 'border-red-500/30 bg-red-500/5'
            )}
          />
        </div>

        {/* Colonne 2 : Trading */}
        <div className='grid grid-cols-2 gap-3'>
          <KPICard
            label='Trades (30j)'
            value={formatNumber(data.kpis.tradesLast30d)}
            subtitle={`${formatNumber(avgVolumePerTrade)} lots/trade`}
            icon={IconArrowsExchange}
            className='col-span-2'
          />
          <KPICard
            label='Volume total'
            value={`${formatNumber(data.kpis.totalVolume30d)}`}
            subtitle='lots'
          />
          <KPICard
            label='Moyenne/trade'
            value={formatNumber(avgVolumePerTrade)}
            subtitle='lots'
          />
        </div>

        {/* Colonne 3 : Financier - Profits */}
        <div className='grid grid-cols-2 gap-3'>
          <KPICard
            label='Profits (30j)'
            value={formatCurrency(data.kpis.profitLast30d)}
            subtitle={`${profitMargin.toFixed(1)}% marge`}
            icon={IconSparkles}
            highlight
            trend={{
              value: data.kpis.profitGrowthRate,
              positive: true
            }}
            className='col-span-2'
          />
          <KPICard
            label='Profits (7j)'
            value={formatCurrency(data.kpis.profitLast7d)}
            subtitle={
              data.kpis.profitLast30d > 0
                ? `${((data.kpis.profitLast7d / data.kpis.profitLast30d) * 100).toFixed(1)}%`
                : 'N/A'
            }
            trend={{
              value:
                data.kpis.profitLast30d > 0
                  ? ((data.kpis.profitLast7d / (data.kpis.profitLast30d / 30)) *
                      7 -
                      1) *
                    100
                  : 0,
              positive: true
            }}
          />
          <KPICard
            label='Moyenne/trade'
            value={formatCurrency(avgProfitPerTrade)}
            subtitle='profit'
          />
        </div>

        {/* Colonne 4 : Revenus & Cashback */}
        <div className='grid grid-cols-2 gap-3'>
          <KPICard
            label='Revenus (30j)'
            value={formatCurrency(data.kpis.revenueLast30d)}
            subtitle='Total'
            icon={IconArrowsExchange}
            className='col-span-2'
          />
          <KPICard
            label='Cashback donné'
            value={formatCurrency(data.kpis.cashbackLast30d)}
            subtitle='Aux traders'
          />
          <KPICard
            label='Marge'
            value={`${profitMargin.toFixed(1)}%`}
            subtitle='Profit/Revenus'
          />
        </div>

        {/* Colonne 5 : Retraits */}
        <div className='grid grid-cols-1 gap-3'>
          <KPICard
            label='Retraits en attente'
            value={data.kpis.pendingWithdrawalsCount}
            subtitle={formatCurrency(data.kpis.pendingWithdrawalsAmount)}
            icon={IconWallet}
            className={cn(
              data.kpis.pendingWithdrawalsCount > 0 &&
                'border-orange-500/30 bg-orange-500/5'
            )}
          />
        </div>
      </div>

      {/* Version Desktop : Grille classique */}
      <div className='hidden space-y-6 md:block'>
        {/* Section principale KPIs */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <KPICard
            label='Utilisateurs totaux'
            value={formatNumber(data.kpis.totalUsers)}
            subtitle={`${data.kpis.totalAccounts} comptes`}
            icon={IconUsers}
          />
          <KPICard
            label='Comptes connectés'
            value={data.kpis.connectedAccounts}
            subtitle={`${accountConnectionRate.toFixed(1)}% taux de connexion`}
            icon={IconBuildingBank}
            trend={{
              value: accountConnectionRate,
              positive: accountConnectionRate >= 70
            }}
          />
          <KPICard
            label='Trades (30j)'
            value={formatNumber(data.kpis.tradesLast30d)}
            subtitle={`${formatNumber(avgVolumePerTrade)} lots/trade`}
            icon={IconArrowsExchange}
          />
          <KPICard
            label='Profits (30j)'
            value={formatCurrency(data.kpis.profitLast30d)}
            subtitle={`${profitMargin.toFixed(1)}% marge | ${formatCurrency(avgProfitPerTrade)}/trade`}
            icon={IconSparkles}
            highlight
            trend={{
              value: data.kpis.profitGrowthRate,
              positive: true
            }}
          />
        </div>

        {/* Section KPIs secondaires */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <KPICard
            label='Volume total (30j)'
            value={`${formatNumber(data.kpis.totalVolume30d)} lots`}
            subtitle={`${formatNumber(avgVolumePerTrade)} lots/trade moyen`}
          />
          <KPICard
            label='Profits (7j)'
            value={formatCurrency(data.kpis.profitLast7d)}
            subtitle={
              data.kpis.profitLast30d > 0
                ? `${((data.kpis.profitLast7d / data.kpis.profitLast30d) * 100).toFixed(1)}% du total 30j`
                : 'N/A'
            }
            trend={{
              value:
                data.kpis.profitLast30d > 0
                  ? ((data.kpis.profitLast7d / (data.kpis.profitLast30d / 30)) *
                      7 -
                      1) *
                    100
                  : 0,
              positive: true
            }}
          />
          <KPICard
            label='Revenus (30j)'
            value={formatCurrency(data.kpis.revenueLast30d)}
            subtitle={`Cashback: ${formatCurrency(data.kpis.cashbackLast30d)}`}
            icon={IconArrowsExchange}
          />
          <KPICard
            label='Retraits en attente'
            value={data.kpis.pendingWithdrawalsCount}
            subtitle={formatCurrency(data.kpis.pendingWithdrawalsAmount)}
            icon={IconWallet}
            className={cn(
              data.kpis.pendingWithdrawalsCount > 0 &&
                'border-orange-500/30 bg-orange-500/5'
            )}
          />
          <KPICard
            label='Comptes en erreur'
            value={data.kpis.errorAccounts}
            subtitle={`${data.kpis.pendingAccounts} en attente`}
            icon={IconAlertTriangle}
            className={cn(
              data.kpis.errorAccounts > 0 && 'border-red-500/30 bg-red-500/5'
            )}
          />
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Graphique Profits avec prévision */}
        <div
          className={cn(
            'rounded-xl p-4 md:p-6',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>
              Profits & Prévisions (30j + 7j)
            </h3>
            <p className='text-muted-foreground text-xs'>
              Évolution des profits (revenus - cashback) et prévision basée sur
              la moyenne des 14 derniers jours
            </p>
          </div>
          <ChartContainer config={chartConfig} className='h-[280px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={mergedSeries}>
                <defs>
                  <linearGradient
                    id='profitGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#10b981' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id='forecastGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#34d399' stopOpacity={0.2} />
                    <stop offset='95%' stopColor='#34d399' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke='rgba(255,255,255,0.06)'
                />
                <XAxis
                  dataKey='day'
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  style={{ fontSize: '11px' }}
                />
                <YAxis
                  tickFormatter={(value) => `${value}€`}
                  style={{ fontSize: '11px' }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className='rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-lg'>
                        {payload.map((entry: any, idx: number) => (
                          <div key={idx} className='text-xs'>
                            <span
                              style={{ color: entry.color }}
                              className='font-medium'
                            >
                              {entry.name}:{' '}
                              {entry.value
                                ? `${Number(entry.value).toFixed(2)}€`
                                : 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='profit'
                  stroke='#10b981'
                  strokeWidth={2}
                  fill='url(#profitGradient)'
                  connectNulls
                />
                <Area
                  type='monotone'
                  dataKey='profitForecast'
                  stroke='#34d399'
                  strokeWidth={2}
                  strokeDasharray='6 6'
                  fill='url(#forecastGradient)'
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Graphique Retraits */}
        <div
          className={cn(
            'rounded-xl p-4 md:p-6',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>Retraits (30j)</h3>
            <p className='text-muted-foreground text-xs'>
              Demandes vs retraits complétés par jour
            </p>
          </div>
          <ChartContainer config={chartConfig} className='h-[280px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data.series}>
                <CartesianGrid
                  vertical={false}
                  stroke='rgba(255,255,255,0.06)'
                />
                <XAxis
                  dataKey='day'
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  style={{ fontSize: '11px' }}
                />
                <YAxis style={{ fontSize: '11px' }} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className='rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-lg'>
                        {payload.map((entry: any, idx: number) => (
                          <div key={idx} className='text-xs'>
                            <span
                              style={{ color: entry.color }}
                              className='font-medium'
                            >
                              {entry.name}: {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey='withdrawalsRequested'
                  fill='#f59e0b'
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey='withdrawalsCompleted'
                  fill='#10b981'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Tableau des brokers */}
      {data.brokerStats && data.brokerStats.length > 0 && (
        <div
          className={cn(
            'rounded-xl p-4 md:p-6',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>Statistiques par Broker</h3>
            <p className='text-muted-foreground text-xs'>
              Vue d'ensemble de l'activité par broker
            </p>
          </div>
          {/* Version desktop : tableau */}
          <div className='hidden overflow-x-auto lg:block'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-white/5 text-left'>
                  <th className='text-muted-foreground pb-3 text-xs font-medium'>
                    Broker
                  </th>
                  <th className='text-muted-foreground pb-3 text-right text-xs font-medium'>
                    Comptes
                  </th>
                  <th className='text-muted-foreground pb-3 text-right text-xs font-medium'>
                    Connectés
                  </th>
                  <th className='text-muted-foreground pb-3 text-right text-xs font-medium'>
                    Volume (lots)
                  </th>
                  <th className='text-muted-foreground pb-3 text-right text-xs font-medium'>
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.brokerStats.map((broker) => (
                  <tr
                    key={broker.broker}
                    className='border-b border-white/5 last:border-0'
                  >
                    <td className='py-3 font-medium'>{broker.broker}</td>
                    <td className='py-3 text-right'>
                      <div className='flex flex-col items-end'>
                        <span>{broker.total}</span>
                        {broker.error > 0 && (
                          <span className='text-xs text-red-400'>
                            {broker.error} erreur{broker.error > 1 ? 's' : ''}
                          </span>
                        )}
                        {broker.pending > 0 && (
                          <span className='text-xs text-yellow-400'>
                            {broker.pending} en attente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='py-3 text-right'>
                      <span
                        className={cn(
                          'font-medium',
                          broker.connected === broker.total
                            ? 'text-green-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        {broker.connected}
                      </span>
                    </td>
                    <td className='py-3 text-right'>
                      {formatNumber(broker.volume)}
                    </td>
                    <td className='py-3 text-right'>
                      <div className='flex flex-col items-end'>
                        <span className='font-medium text-green-400'>
                          {formatCurrency(broker.profit)}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          Rev: {formatCurrency(broker.revenue)}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          CB: {formatCurrency(broker.cashback)}
                          {broker.referralCommission > 0 && (
                            <>
                              {' '}
                              | Ref: {formatCurrency(broker.referralCommission)}
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Version mobile : cartes améliorées avec colonnes */}
          <div className='grid gap-3 lg:hidden'>
            {data.brokerStats.map((broker) => (
              <div
                key={broker.broker}
                className={cn(
                  'rounded-xl p-4',
                  'bg-zinc-900/40 backdrop-blur-sm',
                  'border border-white/5',
                  'transition-colors hover:border-white/10'
                )}
              >
                {/* Header */}
                <div className='mb-4 flex items-center justify-between border-b border-white/5 pb-3'>
                  <h4 className='text-base font-semibold'>{broker.broker}</h4>
                  <div className='flex gap-2'>
                    {(broker.error > 0 || broker.pending > 0) && (
                      <>
                        {broker.error > 0 && (
                          <span className='rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400'>
                            {broker.error} erreur{broker.error > 1 ? 's' : ''}
                          </span>
                        )}
                        {broker.pending > 0 && (
                          <span className='rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400'>
                            {broker.pending} attente
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Colonnes de métriques */}
                <div className='grid grid-cols-2 gap-4'>
                  {/* Colonne gauche */}
                  <div className='space-y-3'>
                    <div>
                      <div className='text-muted-foreground mb-1 text-xs font-medium'>
                        Comptes
                      </div>
                      <div className='flex items-baseline gap-2'>
                        <span className='text-lg font-semibold'>
                          {broker.total}
                        </span>
                        <span
                          className={cn(
                            'text-xs',
                            broker.connected === broker.total
                              ? 'text-green-400'
                              : 'text-muted-foreground'
                          )}
                        >
                          ({broker.connected} connectés)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className='text-muted-foreground mb-1 text-xs font-medium'>
                        Volume
                      </div>
                      <div className='text-base font-semibold'>
                        {formatNumber(broker.volume)}
                        <span className='text-muted-foreground ml-1 text-xs font-normal'>
                          lots
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div className='space-y-3'>
                    <div>
                      <div className='text-muted-foreground mb-1 text-xs font-medium'>
                        Profit
                      </div>
                      <div className='text-lg font-semibold text-green-400'>
                        {formatCurrency(broker.profit)}
                      </div>
                    </div>
                    <div className='space-y-1.5 border-t border-white/5 pt-2'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground/70'>
                          Revenus:
                        </span>
                        <span className='font-medium'>
                          {formatCurrency(broker.revenue)}
                        </span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground/70'>
                          Cashback:
                        </span>
                        <span className='font-medium'>
                          {formatCurrency(broker.cashback)}
                        </span>
                      </div>
                      {broker.referralCommission > 0 && (
                        <div className='flex justify-between text-xs'>
                          <span className='text-muted-foreground/70'>
                            Parrainage:
                          </span>
                          <span className='font-medium text-blue-400'>
                            {formatCurrency(broker.referralCommission)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métriques techniques supplémentaires */}
      <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3'>
        <div
          className={cn(
            'rounded-xl p-4',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>
            Taux de croissance profits
          </div>
          <div className='text-2xl font-bold'>
            <TrendIndicator
              value={data.kpis.profitGrowthRate}
              positive={true}
            />
          </div>
          <div className='text-muted-foreground/70 mt-2 text-xs'>
            vs période précédente (30j)
          </div>
        </div>

        <div
          className={cn(
            'rounded-xl p-4',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>
            Profit moyen par trade
          </div>
          <div className='text-2xl font-bold text-green-400'>
            {formatCurrency(avgProfitPerTrade)}
          </div>
          <div className='text-muted-foreground/70 mt-2 text-xs'>
            Sur {data.kpis.tradesLast30d} trades
          </div>
        </div>

        <div
          className={cn(
            'rounded-xl p-4',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>
            Marge de profit
          </div>
          <div className='text-2xl font-bold text-blue-400'>
            {profitMargin.toFixed(1)}%
          </div>
          <div className='text-muted-foreground/70 mt-2 text-xs'>
            {formatCurrency(data.kpis.profitLast30d)} /{' '}
            {formatCurrency(data.kpis.revenueLast30d)}
          </div>
        </div>

        <div
          className={cn(
            'rounded-xl p-4',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>
            Taux de connexion
          </div>
          <div className='text-2xl font-bold'>
            {accountConnectionRate.toFixed(1)}%
          </div>
          <div className='text-muted-foreground/70 mt-2 text-xs'>
            {data.kpis.connectedAccounts} / {data.kpis.totalAccounts} comptes
          </div>
        </div>
      </div>
    </div>
  );
}
