'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useTradingData } from '@/hooks/use-trading-data';
import { cn } from '@/lib/utils';

// Couleurs accent jaune/vert RendR - variations de #c5d13f
const COLORS = [
  '#c5d13f', // Accent principal
  '#d4db5a', // Plus clair
  '#b5c032', // Plus foncé
  '#e0e679', // Très clair
  '#a5b028' // Très foncé
];

export function BrokerDistribution() {
  const { transactions, isLoading } = useTradingData();

  // Calculer les stats par broker depuis les transactions réelles
  const brokerStats = useMemo(() => {
    const statsByBroker = new Map<string, number>();

    transactions.forEach((transaction) => {
      const brokerName = transaction.broker.name;
      const currentCashback = statsByBroker.get(brokerName) || 0;
      statsByBroker.set(
        brokerName,
        currentCashback + transaction.cashback_amount
      );
    });

    // Convertir en array et trier par cashback décroissant
    return Array.from(statsByBroker.entries())
      .map(([brokerName, cashback]) => ({
        broker_name: brokerName,
        cashback: cashback
      }))
      .sort((a, b) => b.cashback - a.cashback);
  }, [transactions]);

  const totalCashback = useMemo(
    () => brokerStats.reduce((acc, curr) => acc + curr.cashback, 0),
    [brokerStats]
  );

  // Créer le chartConfig dynamiquement
  const chartConfig = useMemo(
    () =>
      brokerStats.reduce((acc, broker, index) => {
        acc[broker.broker_name] = {
          label: broker.broker_name,
          color: COLORS[index % COLORS.length]
        };
        return acc;
      }, {} as ChartConfig),
    [brokerStats]
  );

  const pieData = useMemo(
    () =>
      brokerStats.map((broker, index) => ({
        name: broker.broker_name,
        value: broker.cashback,
        percentage:
          totalCashback > 0
            ? ((broker.cashback / totalCashback) * 100).toFixed(1)
            : '0',
        fill: COLORS[index % COLORS.length]
      })),
    [brokerStats, totalCashback]
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex h-full flex-col rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-pulse'
        )}
      />
    );
  }

  if (brokerStats.length === 0) {
    return (
      <div
        className={cn(
          'flex h-full flex-col items-center justify-center rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5'
        )}
      >
        <p className='text-muted-foreground text-sm'>
          Aucune donnée de trading disponible
        </p>
      </div>
    );
  }

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
