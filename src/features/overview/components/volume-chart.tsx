'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { monthlyStatsData } from '@/constants/cashback-data';
import { cn } from '@/lib/utils';

const chartConfig = {
  volume: {
    label: 'Volume',
    color: 'oklch(0.85 0 0)' // Gris clair monochrome
  },
  trades: {
    label: 'Trades',
    color: 'oklch(0.65 0 0)' // Gris moyen monochrome
  }
} satisfies ChartConfig;

export function VolumeChart() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('volume');

  const total = React.useMemo(
    () => ({
      volume: monthlyStatsData.reduce((acc, curr) => acc + curr.volume, 0),
      trades: monthlyStatsData.reduce((acc, curr) => acc + curr.trades, 0)
    }),
    []
  );

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
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
                <stop
                  offset='0%'
                  stopColor='oklch(0.85 0 0)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='oklch(0.85 0 0)'
                  stopOpacity={0.2}
                />
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
