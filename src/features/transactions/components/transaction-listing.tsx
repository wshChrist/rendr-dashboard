'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useTradingData } from '@/hooks/use-trading-data';
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
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Transaction } from '@/types/cashback';

export function TransactionListing() {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : fr;
  const { transactions, accounts, isLoading } = useTradingData();
  const [selectedBroker, setSelectedBroker] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Calcul des statistiques depuis les données réelles
  const stats = useMemo(() => {
    if (transactions.length === 0) {
      return {
        totalCashback: 0,
        totalVolume: 0,
        totalTrades: 0,
        confirmedTrades: 0,
        pendingTrades: 0,
        totalCommission: 0,
        avgCashbackPerTrade: 0,
        topPairs: []
      };
    }

    const totalCashback = transactions.reduce(
      (acc, t) => acc + t.cashback_amount,
      0
    );
    const totalVolume = transactions.reduce((acc, t) => acc + t.volume, 0);
    const confirmedTrades = transactions.filter(
      (t) => t.status === 'confirmed'
    ).length;
    const pendingTrades = transactions.filter(
      (t) => t.status === 'pending'
    ).length;
    const totalCommission = transactions.reduce(
      (acc, t) => acc + t.commission,
      0
    );
    const avgCashbackPerTrade =
      transactions.length > 0 ? totalCashback / transactions.length : 0;

    // Top pairs
    const pairCounts = transactions.reduce(
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
      totalTrades: transactions.length,
      confirmedTrades,
      pendingTrades,
      totalCommission,
      avgCashbackPerTrade,
      topPairs
    };
  }, [transactions]);

  // Filtrage des données
  const filteredData = useMemo(() => {
    let data = [...transactions];

    if (selectedBroker !== 'all') {
      data = data.filter((t) => t.user_broker_id === selectedBroker);
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
  }, [transactions, selectedBroker, selectedPeriod, selectedStatus]);

  // Stats filtrées
  const filteredStats = useMemo(() => {
    const totalCashback = filteredData.reduce(
      (acc, t) => acc + t.cashback_amount,
      0
    );
    const totalVolume = filteredData.reduce((acc, t) => acc + t.volume, 0);
    return { totalCashback, totalVolume, count: filteredData.length };
  }, [filteredData]);

  // Fonction d'export CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert(t('transactions.noTransactionsToExport'));
      return;
    }

    // En-têtes CSV
    const headers = [
      t('pages.transactions.columns.date'),
      t('common.time'),
      t('pages.transactions.columns.broker'),
      t('common.tradeId'),
      t('pages.transactions.columns.pair'),
      t('pages.transactions.columns.volume'),
      t('pages.transactions.columns.commission'),
      t('pages.transactions.columns.cashback'),
      t('pages.transactions.columns.status')
    ];

    // Conversion des données en lignes CSV
    const rows = filteredData.map((transaction: Transaction) => {
      const date = new Date(transaction.trade_date);
      const formattedDate = format(date, 'dd/MM/yyyy', { locale: dateLocale });
      const formattedTime = format(date, 'HH:mm', { locale: dateLocale });
      const status =
        transaction.status === 'confirmed'
          ? t('pages.transactions.status.confirmed')
          : t('pages.transactions.status.pending');

      return [
        formattedDate,
        formattedTime,
        transaction.broker.name,
        transaction.trade_id,
        transaction.pair,
        transaction.volume.toFixed(2),
        transaction.commission.toFixed(2),
        transaction.cashback_amount.toFixed(2),
        status
      ];
    });

    // Création du contenu CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Création du BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);

    // Création du lien de téléchargement
    const link = document.createElement('a');
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss', { locale: fr });
    link.href = url;
    link.download = `transactions_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
              {stats.confirmedTrades} {t('transactions.stats.confirmed')}
            </RendRBadge>
            {stats.pendingTrades > 0 && (
              <RendRBadge variant='outline' size='sm' dot dotColor='yellow'>
                {stats.pendingTrades} {t('transactions.stats.pending')}
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
            <span className='text-sm font-medium'>{t('common.filters')}</span>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {/* Filtre Broker */}
            <Select value={selectedBroker} onValueChange={setSelectedBroker}>
              <SelectTrigger className='w-[160px] border-white/10 bg-white/5'>
                <SelectValue placeholder={t('common.allBrokers')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.allBrokers')}</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.broker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre Période */}
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className='w-[140px] border-white/10 bg-white/5'>
                <IconCalendar className='mr-2 h-4 w-4' />
                <SelectValue placeholder={t('common.period')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('transactions.allTime')}</SelectItem>
                <SelectItem value='7d'>7 derniers jours</SelectItem>
                <SelectItem value='30d'>30 derniers jours</SelectItem>
                <SelectItem value='90d'>90 derniers jours</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre Status */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className='w-[140px] border-white/10 bg-white/5'>
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  {t('transactions.allStatuses')}
                </SelectItem>
                <SelectItem value='confirmed'>
                  {t('transactions.status.confirmed')}
                </SelectItem>
                <SelectItem value='pending'>
                  {t('transactions.status.pending')}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Bouton Export */}
            <Button
              variant='outline'
              size='sm'
              className='border-white/10 bg-white/5'
              onClick={exportToCSV}
              disabled={filteredData.length === 0}
            >
              <IconDownload className='mr-2 h-4 w-4' />
              {t('common.actions.export')}
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
      {isLoading ? (
        <div className='flex items-center justify-center p-8'>
          <p className='text-muted-foreground'>
            Chargement des transactions...
          </p>
        </div>
      ) : (
        <TransactionTable
          data={filteredData}
          totalItems={filteredData.length}
        />
      )}
    </div>
  );
}
