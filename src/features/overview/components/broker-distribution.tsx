'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { brokerStatsData } from '@/constants/cashback-data';
import { cn } from '@/lib/utils';

// Couleurs monochromes style RendR - nuances de gris
const COLORS = [
  'oklch(0.95 0 0)', // Gris clair
  'oklch(0.75 0 0)', // Gris moyen-clair
  'oklch(0.55 0 0)', // Gris moyen
  'oklch(0.40 0 0)', // Gris moyen-foncé
  'oklch(0.25 0 0)' // Gris foncé
];

const chartConfig = brokerStatsData.reduce((acc, broker, index) => {
  acc[broker.broker_name] = {
    label: broker.broker_name,
    color: COLORS[index % COLORS.length]
  };
  return acc;
}, {} as ChartConfig);

export function BrokerDistribution() {
  const totalCashback = brokerStatsData.reduce(
    (acc, curr) => acc + curr.cashback,
    0
  );

  const pieData = brokerStatsData.map((broker, index) => ({
    name: broker.broker_name,
    value: broker.cashback,
    percentage: ((broker.cashback / totalCashback) * 100).toFixed(1),
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-2xl p-5 md:p-6',
        'bg-zinc-900/40 backdrop-blur-sm',
        'border border-white/5',
        'transition-all duration-300',
        'hover:border-white/8 hover:bg-zinc-900/50'
      )}
    >
      {/* Header */}
      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>Répartition par Broker</h3>
        <p className='text-muted-foreground text-sm'>
          Distribution du cashback par broker partenaire
        </p>
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className='mx-auto h-[180px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={pieData}
              cx='50%'
              cy='50%'
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey='value'
              strokeWidth={0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Legend */}
      <div className='mt-4 space-y-2'>
        {pieData.map((broker, index) => (
          <div
            key={index}
            className='group -mx-2 flex items-center justify-between rounded-lg p-2 text-sm transition-colors hover:bg-white/5'
          >
            <div className='flex items-center gap-2'>
              <div
                className='h-3 w-3 rounded-full'
                style={{ backgroundColor: broker.fill }}
              />
              <span className='text-foreground/80 group-hover:text-foreground transition-colors'>
                {broker.name}
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <span className='text-muted-foreground'>
                {broker.percentage}%
              </span>
              <span className='text-foreground font-semibold'>
                {broker.value.toFixed(2)}€
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
