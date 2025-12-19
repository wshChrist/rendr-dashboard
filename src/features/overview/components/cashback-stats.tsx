'use client';

import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { monthlyStatsData } from '@/constants/cashback-data';
import { cn } from '@/lib/utils';

const chartConfig = {
  cashback: {
    label: 'Cashback',
    color: 'oklch(0.85 0 0)' // Gris clair monochrome
  },
  volume: {
    label: 'Volume (lots)',
    color: 'oklch(0.65 0 0)' // Gris moyen monochrome
  }
} satisfies ChartConfig;

export function CashbackStatsGraph() {
  const totalCashback = monthlyStatsData.reduce(
    (acc, curr) => acc + curr.cashback,
    0
  );
  const lastMonth = monthlyStatsData[monthlyStatsData.length - 1];
  const prevMonth = monthlyStatsData[monthlyStatsData.length - 2];
  const growth = prevMonth
    ? ((lastMonth.cashback - prevMonth.cashback) / prevMonth.cashback) * 100
    : 0;
  const isPositive = growth >= 0;

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
      <div className='p-5 pb-0 md:p-6'>
        <h3 className='text-lg font-semibold'>Évolution du Cashback</h3>
        <p className='text-muted-foreground text-sm'>
          Votre cashback sur les 6 derniers mois
        </p>
      </div>

      {/* Chart */}
      <div className='p-4 sm:p-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={monthlyStatsData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillCashback' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='oklch(0.85 0 0)'
                  stopOpacity={0.6}
                />
                <stop
                  offset='95%'
                  stopColor='oklch(0.85 0 0)'
                  stopOpacity={0.05}
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
              tickFormatter={(value) => `${value}€`}
              tick={{ fill: 'oklch(0.6 0 0)' }}
            />
            <ChartTooltip
              cursor={{
                stroke: 'oklch(0.85 0 0)',
                strokeWidth: 1,
                strokeDasharray: '4 4'
              }}
              content={
                <ChartTooltipContent
                  className='border-white/10 bg-zinc-900'
                  indicator='dot'
                  formatter={(value, name) => (
                    <span>
                      {name === 'cashback' ? `${value}€` : `${value} lots`}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey='cashback'
              type='monotone'
              fill='url(#fillCashback)'
              stroke='oklch(0.85 0 0)'
              strokeWidth={2}
              animationDuration={1500}
              animationEasing='ease-out'
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Footer */}
      <div className='border-t border-white/5 px-5 pt-2 pb-5 md:px-6 md:pb-6'>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {isPositive ? (
                <>
                  En hausse de {growth.toFixed(1)}% ce mois
                  <IconTrendingUp className='h-4 w-4 text-[#c5d13f]' />
                </>
              ) : (
                <>
                  En baisse de {Math.abs(growth).toFixed(1)}% ce mois
                  <IconTrendingDown className='text-muted-foreground h-4 w-4' />
                </>
              )}
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              Total:{' '}
              <span className='text-foreground font-semibold'>
                {totalCashback.toFixed(2)}€
              </span>{' '}
              sur 6 mois
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
