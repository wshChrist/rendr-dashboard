'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useTradingData } from '@/hooks/use-trading-data';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const chartConfig = {
  volume: {
    label: 'Volume',
    color: '#c5d13f' // Jaune/vert accent RendR
  },
  trades: {
    label: 'Trades',
    color: '#c5d13f' // Jaune/vert accent RendR
  }
} satisfies ChartConfig;

export function VolumeChart() {
  const { trades, isLoading } = useTradingData();
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('volume');

  // Calculer les stats mensuelles depuis les trades réels
  const monthlyStatsData = useMemo(() => {
    const monthNames = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre'
    ];

    // Grouper les trades par mois
    const tradesByMonth = new Map<string, { volume: number; trades: number }>();

    // Obtenir les 6 derniers mois
    const now = new Date();
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last6Months.push(key);
      tradesByMonth.set(key, { volume: 0, trades: 0 });
    }

    // Agréger les trades par mois
    trades.forEach((trade) => {
      const tradeDate = new Date(trade.close_time);
      const monthKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;

      if (tradesByMonth.has(monthKey)) {
        const monthData = tradesByMonth.get(monthKey)!;
        monthData.volume += parseFloat(trade.lots || '0');
        monthData.trades += 1;
      }
    });

    // Convertir en format attendu par le graphique
    return last6Months.map((monthKey) => {
      const [year, month] = monthKey.split('-');
      const monthIndex = parseInt(month) - 1;
      const monthData = tradesByMonth.get(monthKey) || { volume: 0, trades: 0 };

      return {
        month: monthNames[monthIndex],
        volume: monthData.volume,
        trades: monthData.trades
      };
    });
  }, [trades]);

  const total = useMemo(
    () => ({
      volume: monthlyStatsData.reduce((acc, curr) => acc + curr.volume, 0),
      trades: monthlyStatsData.reduce((acc, curr) => acc + curr.trades, 0)
    }),
    [monthlyStatsData]
  );

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          '@container/card rounded-2xl',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'h-[400px] animate-pulse'
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        '@container/card rounded-2xl',
        'bg-zinc-900/40 backdrop-blur-sm',
        'border border-white/5',
        'transition-all duration-300',
        'hover:border-white/8 hover:bg-zinc-900/50'
      )}
    >
      {/* Header */}
      <div className='flex flex-col items-stretch border-b border-white/5 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 p-5 md:p-6'>
          <h3 className='text-lg font-semibold'>Volume de Trading</h3>
          <p className='text-muted-foreground text-sm'>
            <span className='hidden @[540px]/card:block'>
              Statistiques sur les 6 derniers mois
            </span>
            <span className='@[540px]/card:hidden'>6 derniers mois</span>
          </p>
        </div>
        <div className='flex border-t border-white/5 sm:border-t-0'>
          {(['volume', 'trades'] as const).map((key, idx) => {
            const chart = key;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className={cn(
                  'relative flex flex-1 flex-col justify-center gap-1',
                  'px-5 py-4 sm:px-6 sm:py-5',
                  'text-left transition-all duration-200',
                  'hover:bg-white/5',
                  'data-[active=true]:bg-white/5',
                  idx > 0 && 'border-l border-white/5'
                )}
                onClick={() => setActiveChart(chart)}
              >
                <span className='text-muted-foreground text-xs'>
                  {chartConfig[chart].label}
                </span>
                <span className='stat-number text-xl leading-none font-bold sm:text-2xl'>
                  {key === 'volume'
                    ? `${total[key].toFixed(1)} lots`
                    : total[key].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className='p-4 sm:p-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart
            data={monthlyStatsData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillVolume' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#c5d13f' stopOpacity={0.8} />
                <stop offset='100%' stopColor='#c5d13f' stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray='3 3'
              stroke='oklch(1 0 0 / 10%)'
            />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(0, 3)}
              tick={{ fill: 'oklch(0.6 0 0)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                activeChart === 'volume' ? `${value}` : value.toString()
              }
              tick={{ fill: 'oklch(0.6 0 0)' }}
            />
            <ChartTooltip
              cursor={{ fill: 'oklch(1 0 0 / 5%)' }}
              content={
                <ChartTooltipContent
                  className='w-[150px] border-white/10 bg-zinc-900'
                  formatter={(value) => (
                    <span>
                      {activeChart === 'volume'
                        ? `${value} lots`
                        : `${value} trades`}
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill='url(#fillVolume)'
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
