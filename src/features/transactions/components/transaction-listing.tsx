'use client';

import { transactionsData, userBrokersData } from '@/constants/cashback-data';
import { TransactionTable } from './transaction-tables';
import { cn } from '@/lib/utils';
import {
  IconReceipt,
  IconTrendingUp,
  IconChartBar,
  IconCash,
  IconCalendar,
  IconFilter,
  IconDownload
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { RendRBadge } from '@/components/ui/rendr-badge';

export function TransactionListing() {
  const [selectedBroker, setSelectedBroker] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Calcul des statistiques
  const stats = useMemo(() => {
    const totalCashback = transactionsData.reduce(
      (acc, t) => acc + t.cashback_amount,
      0
    );
    const totalVolume = transactionsData.reduce((acc, t) => acc + t.volume, 0);
    const confirmedTrades = transactionsData.filter(
      (t) => t.status === 'confirmed'
    ).length;
    const pendingTrades = transactionsData.filter(
      (t) => t.status === 'pending'
    ).length;
    const totalCommission = transactionsData.reduce(
      (acc, t) => acc + t.commission,
      0
    );
    const avgCashbackPerTrade = totalCashback / transactionsData.length;

    // Top pairs
    const pairCounts = transactionsData.reduce(
      (acc, t) => {
        acc[t.pair] = (acc[t.pair] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topPairs = Object.entries(pairCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      totalCashback,
      totalVolume,
      totalTrades: transactionsData.length,
      confirmedTrades,
      pendingTrades,
      totalCommission,
      avgCashbackPerTrade,
      topPairs
    };
  }, []);

  // Filtrage des données
  const filteredData = useMemo(() => {
    let data = [...transactionsData];

    if (selectedBroker !== 'all') {
      data = data.filter((t) => t.broker.id === selectedBroker);
    }

    if (selectedStatus !== 'all') {
      data = data.filter((t) => t.status === selectedStatus);
    }

    if (selectedPeriod !== 'all') {
      const now = new Date();
      const periodDays: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      };
      const days = periodDays[selectedPeriod];
      if (days) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        data = data.filter((t) => new Date(t.trade_date) >= cutoff);
      }
    }

    return data;
  }, [selectedBroker, selectedPeriod, selectedStatus]);

  // Stats filtrées
  const filteredStats = useMemo(() => {
    const totalCashback = filteredData.reduce(
      (acc, t) => acc + t.cashback_amount,
      0
    );
    const totalVolume = filteredData.reduce((acc, t) => acc + t.volume, 0);
    return { totalCashback, totalVolume, count: filteredData.length };
  }, [filteredData]);

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {/* Total Cashback */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-[#c5d13f]/20',
            'transition-all duration-300',
            'hover:border-[#c5d13f]/40',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
              <IconCash className='h-5 w-5 text-[#c5d13f]' />
            </div>
            <span className='text-muted-foreground text-sm'>
              Total Cashback
            </span>
          </div>
          <p className='stat-number text-3xl font-bold text-[#c5d13f]'>
            +{stats.totalCashback.toFixed(2)}€
          </p>
          <p className='text-muted-foreground/60 mt-1 text-sm'>
            ~{stats.avgCashbackPerTrade.toFixed(2)}€ par trade
          </p>
        </div>

        {/* Volume Total */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconChartBar className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>Volume Total</span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {stats.totalVolume.toFixed(2)}
          </p>
          <p className='text-muted-foreground/60 mt-1 text-sm'>lots tradés</p>
        </div>

        {/* Nombre de Trades */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconReceipt className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>Trades</span>
          </div>
          <p className='stat-number text-3xl font-bold'>{stats.totalTrades}</p>
          <div className='mt-1 flex items-center gap-2'>
            <RendRBadge variant='success' size='sm' dot dotColor='green'>
              {stats.confirmedTrades} confirmés
            </RendRBadge>
            {stats.pendingTrades > 0 && (
              <RendRBadge variant='outline' size='sm' dot dotColor='yellow'>
                {stats.pendingTrades} en attente
              </RendRBadge>
            )}
          </div>
        </div>

        {/* Top Paires */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconTrendingUp className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>
              Paires populaires
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {stats.topPairs.map(([pair, count], index) => (
              <RendRBadge
                key={pair}
                variant={index === 0 ? 'accent' : 'outline'}
                className='font-mono'
              >
                {pair} ({count})
              </RendRBadge>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className={cn(
          'rounded-2xl p-4',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
      >
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <div className='flex items-center gap-2'>
            <IconFilter className='text-muted-foreground h-4 w-4' />
            <span className='text-sm font-medium'>Filtres</span>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {/* Filtre Broker */}
            <Select value={selectedBroker} onValueChange={setSelectedBroker}>
              <SelectTrigger className='w-[160px] border-white/10 bg-white/5'>
                <SelectValue placeholder='Tous les brokers' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les brokers</SelectItem>
                {userBrokersData.map((ub) => (
                  <SelectItem key={ub.broker_id} value={ub.broker_id}>
                    {ub.broker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre Période */}
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className='w-[140px] border-white/10 bg-white/5'>
                <IconCalendar className='mr-2 h-4 w-4' />
                <SelectValue placeholder='Période' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tout le temps</SelectItem>
                <SelectItem value='7d'>7 derniers jours</SelectItem>
                <SelectItem value='30d'>30 derniers jours</SelectItem>
                <SelectItem value='90d'>90 derniers jours</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre Status */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className='w-[140px] border-white/10 bg-white/5'>
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous statuts</SelectItem>
                <SelectItem value='confirmed'>Confirmés</SelectItem>
                <SelectItem value='pending'>En attente</SelectItem>
              </SelectContent>
            </Select>

            {/* Bouton Export */}
            <Button
              variant='outline'
              size='sm'
              className='border-white/10 bg-white/5'
            >
              <IconDownload className='mr-2 h-4 w-4' />
              Exporter
            </Button>
          </div>
        </div>

        {/* Active filters info */}
        {(selectedBroker !== 'all' ||
          selectedPeriod !== 'all' ||
          selectedStatus !== 'all') && (
          <div className='mt-4 flex items-center gap-2 border-t border-white/5 pt-4'>
            <span className='text-muted-foreground text-sm'>
              Résultats filtrés:
            </span>
            <RendRBadge variant='accent'>
              {filteredStats.count} trades
            </RendRBadge>
            <span className='text-muted-foreground text-sm'>•</span>
            <span className='text-sm text-[#c5d13f]'>
              +{filteredStats.totalCashback.toFixed(2)}€
            </span>
            <span className='text-muted-foreground text-sm'>•</span>
            <span className='text-muted-foreground text-sm'>
              {filteredStats.totalVolume.toFixed(2)} lots
            </span>
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto text-xs'
              onClick={() => {
                setSelectedBroker('all');
                setSelectedPeriod('all');
                setSelectedStatus('all');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <TransactionTable data={filteredData} totalItems={filteredData.length} />
    </div>
  );
}
