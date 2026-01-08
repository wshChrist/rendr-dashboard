'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useTradingData } from '@/hooks/use-trading-data';
import { cn } from '@/lib/utils';
import {
  IconReceipt,
  IconTrendingUp,
  IconChartBar,
  IconCash,
  IconCalendar,
  IconFilter,
  IconDownload,
  IconSparkles,
  IconTrophy,
  IconGift,
  IconCoins,
  IconArrowUp,
  IconCheck,
  IconClock,
  IconInfoCircle,
  IconChevronRight,
  IconTrendingDown,
  IconX
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { RendRBadge } from '@/components/ui/rendr-badge';
import {
  AnimatedNumber,
  AnimatedInteger
} from '@/components/ui/animated-number';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Transaction } from '@/types/cashback';
import { ScrollArea } from '@/components/ui/scroll-area';

// Composant pour afficher le logo du broker
function BrokerLogo({
  broker
}: {
  broker: { name: string; logo_url: string };
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className='relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5'>
      {!imageError && broker.logo_url ? (
        <img
          src={broker.logo_url}
          alt={broker.name}
          className='h-full w-full object-contain p-1'
          onError={() => setImageError(true)}
        />
      ) : (
        <span className='text-xs font-bold'>
          {broker.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

// Composant de carte de transaction qui célèbre le cashback
function TransactionCard({
  transaction,
  index
}: {
  transaction: Transaction;
  index: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : fr;
  const date = new Date(transaction.trade_date);
  const isConfirmed = transaction.status === 'confirmed';
  const cashback = transaction.cashback_amount;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:border-[#c5d13f]/30 hover:shadow-xl hover:shadow-[#c5d13f]/10',
        'hover:-translate-y-1',
        'animate-fade-in-up opacity-0'
      )}
      style={{
        animationDelay: `${index * 30}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {/* Effet de brillance au survol */}
      <div className='absolute inset-0 bg-gradient-to-br from-[#c5d13f]/0 via-[#c5d13f]/0 to-[#c5d13f]/0 transition-all duration-500 group-hover:from-[#c5d13f]/5 group-hover:via-[#c5d13f]/0 group-hover:to-[#c5d13f]/5' />

      <CardContent className='relative pt-6'>
        <div className='flex items-start justify-between gap-4'>
          {/* Partie gauche - Broker et infos */}
          <div className='flex min-w-0 flex-1 items-start gap-4'>
            <BrokerLogo broker={transaction.broker} />

            <div className='min-w-0 flex-1 space-y-2'>
              <div className='flex items-center gap-2'>
                <h4 className='truncate font-semibold'>
                  {transaction.broker.name}
                </h4>
                {isConfirmed && (
                  <RendRBadge variant='success' size='sm' dot dotColor='green'>
                    <IconCheck className='mr-1 h-3 w-3' />
                    {t('pages.transactions.status.confirmed')}
                  </RendRBadge>
                )}
                {!isConfirmed && (
                  <RendRBadge variant='outline' size='sm' dot dotColor='yellow'>
                    <IconClock className='mr-1 h-3 w-3' />
                    {t('pages.transactions.status.pending')}
                  </RendRBadge>
                )}
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <RendRBadge variant='outline' className='font-mono text-xs'>
                  {transaction.pair}
                </RendRBadge>
                <span className='text-muted-foreground text-xs'>
                  {format(date, 'dd MMM yyyy', { locale: dateLocale })}
                </span>
                <span className='text-muted-foreground/60 text-xs'>
                  {format(date, 'HH:mm', { locale: dateLocale })}
                </span>
              </div>

              <div className='flex items-center gap-4 text-xs'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-muted-foreground/60'>
                    {t('pages.transactions.columns.volume')}:
                  </span>
                  <span className='font-medium'>
                    {transaction.volume.toFixed(2)}{' '}
                    {t('pages.transactions.lots')}
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='text-muted-foreground/60'>
                    {t('pages.transactions.columns.commission')}:
                  </span>
                  <span className='text-muted-foreground'>
                    {transaction.commission.toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Partie droite - Cashback mis en avant */}
          <div className='flex flex-col items-end gap-2'>
            <div
              className={cn(
                'relative rounded-xl border-2 p-4',
                'border-[#c5d13f]/30 bg-gradient-to-br from-[#c5d13f]/10 to-[#c5d13f]/5',
                'transition-all duration-300',
                'group-hover:border-[#c5d13f]/50 group-hover:from-[#c5d13f]/20 group-hover:to-[#c5d13f]/10',
                'group-hover:scale-105'
              )}
            >
              <div className='absolute -top-2 -right-2 rounded-full bg-[#c5d13f]/20 p-1'>
                <IconSparkles className='h-3 w-3 text-[#c5d13f]' />
              </div>
              <div className='text-center'>
                <p className='text-muted-foreground mb-1 text-xs'>
                  {t('transactions.celebration.cashbackEarned')}
                </p>
                <p className='text-2xl font-bold text-[#c5d13f]'>
                  +{cashback.toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TransactionListing() {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : fr;
  const { transactions, accounts, isLoading } = useTradingData();
  const [selectedBroker, setSelectedBroker] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        topPairs: [],
        cashbackGrowth: 0,
        recentCashback: 0
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

    // Cashback des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCashback = transactions
      .filter((t) => new Date(t.trade_date) >= sevenDaysAgo)
      .reduce((acc, t) => acc + t.cashback_amount, 0);

    // Calcul de la croissance
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const previousPeriodCashback = transactions
      .filter(
        (t) =>
          new Date(t.trade_date) >= fourteenDaysAgo &&
          new Date(t.trade_date) < sevenDaysAgo
      )
      .reduce((acc, t) => acc + t.cashback_amount, 0);

    const cashbackGrowth =
      previousPeriodCashback > 0
        ? ((recentCashback - previousPeriodCashback) / previousPeriodCashback) *
          100
        : 0;

    return {
      totalCashback,
      totalVolume,
      totalTrades: transactions.length,
      confirmedTrades,
      pendingTrades,
      totalCommission,
      avgCashbackPerTrade,
      topPairs,
      cashbackGrowth,
      recentCashback
    };
  }, [transactions]);

  // Filtrage des données
  const filteredData = useMemo(() => {
    let data = [...transactions];

    // Filtre par broker
    if (selectedBroker !== 'all') {
      data = data.filter((t) => t.user_broker_id === selectedBroker);
    }

    // Filtre par statut
    if (selectedStatus !== 'all') {
      data = data.filter((t) => t.status === selectedStatus);
    }

    // Filtre par période
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

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (t) =>
          t.broker.name.toLowerCase().includes(query) ||
          t.pair.toLowerCase().includes(query) ||
          t.trade_id.toLowerCase().includes(query)
      );
    }

    // Trier par date (plus récent en premier)
    data.sort(
      (a, b) =>
        new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
    );

    return data;
  }, [
    transactions,
    selectedBroker,
    selectedPeriod,
    selectedStatus,
    searchQuery
  ]);

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

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss', { locale: fr });
    link.href = url;
    link.download = `transactions_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    selectedBroker !== 'all' ||
    selectedPeriod !== 'all' ||
    selectedStatus !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div className='space-y-6'>
      {/* Header inspirant - Célébrer le cashback */}
      <Card
        className={cn(
          'relative overflow-hidden',
          'border-[#c5d13f]/30 bg-gradient-to-br from-[#c5d13f]/10 via-zinc-900/40 to-zinc-900/40',
          'backdrop-blur-sm',
          'transition-all duration-500',
          'hover:border-[#c5d13f]/50 hover:shadow-xl hover:shadow-[#c5d13f]/10',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className='absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#c5d13f]/10 blur-3xl' />
        <div className='absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#c5d13f]/5 blur-3xl' />
        <CardContent className='relative pt-6'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='rounded-xl border border-[#c5d13f]/30 bg-[#c5d13f]/20 p-3'>
                  <IconSparkles className='h-6 w-6 text-[#c5d13f]' />
                </div>
                <div>
                  <CardTitle className='text-2xl md:text-3xl'>
                    {t('transactions.celebration.title')}
                  </CardTitle>
                  <CardDescription className='text-base'>
                    {t('transactions.celebration.description')}
                  </CardDescription>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-3 pt-2'>
                <RendRBadge
                  variant='accent'
                  className='border-[#c5d13f]/30 bg-[#c5d13f]/20 text-[#c5d13f]'
                >
                  <IconTrophy className='mr-1.5 h-3.5 w-3.5' />
                  {t('transactions.celebration.everyTrade')}
                </RendRBadge>
                <RendRBadge
                  variant='outline'
                  className='border-white/10 bg-white/5'
                >
                  <IconGift className='mr-1.5 h-3.5 w-3.5' />
                  {t('transactions.celebration.automatic')}
                </RendRBadge>
                <RendRBadge
                  variant='outline'
                  className='border-white/10 bg-white/5'
                >
                  <IconCoins className='mr-1.5 h-3.5 w-3.5' />
                  {t('transactions.celebration.noLimit')}
                </RendRBadge>
              </div>
            </div>
            <div className='flex flex-col items-end gap-2'>
              <div className='text-right'>
                <p className='text-muted-foreground text-sm'>
                  {t('transactions.celebration.totalEarned')}
                </p>
                <p className='text-4xl font-bold text-[#c5d13f] md:text-5xl'>
                  <AnimatedNumber value={stats.totalCashback} suffix='€' />
                </p>
              </div>
              {stats.cashbackGrowth !== 0 && (
                <div className='flex items-center gap-1.5'>
                  {stats.cashbackGrowth > 0 ? (
                    <IconArrowUp className='h-4 w-4 text-green-500' />
                  ) : (
                    <IconTrendingDown className='h-4 w-4 text-red-500' />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      stats.cashbackGrowth > 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    )}
                  >
                    {Math.abs(stats.cashbackGrowth).toFixed(1)}%
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {t('transactions.celebration.last7Days')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards améliorées */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {/* Total Cashback - Carte principale */}
        <Card
          className={cn(
            'relative overflow-hidden',
            'border-[#c5d13f]/30 bg-gradient-to-br from-[#c5d13f]/10 to-zinc-900/40',
            'backdrop-blur-sm',
            'transition-all duration-300 ease-out',
            'hover:border-[#c5d13f]/50 hover:shadow-xl hover:shadow-[#c5d13f]/10',
            'hover:-translate-y-1',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className='absolute -top-10 -right-10 h-20 w-20 rounded-full bg-[#c5d13f]/10 blur-2xl' />
          <CardHeader className='pb-3'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='rounded-xl border border-[#c5d13f]/30 bg-[#c5d13f]/20 p-2'>
                <IconCash className='h-5 w-5 text-[#c5d13f]' />
              </div>
              <CardDescription className='mb-0'>
                {t('stats.totalCashback')}
              </CardDescription>
            </div>
            <CardTitle className='text-3xl font-bold text-[#c5d13f]'>
              <AnimatedNumber value={stats.totalCashback} suffix='€' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-muted-foreground/60'>
                  {t('transactions.avgPerTrade')}
                </span>
                <span className='font-medium text-[#c5d13f]'>
                  {stats.avgCashbackPerTrade.toFixed(2)}€
                </span>
              </div>
              <Progress
                value={Math.min((stats.totalCashback / 1000) * 100, 100)}
                className='h-1.5 bg-[#c5d13f]/20'
              />
            </div>
          </CardContent>
        </Card>

        {/* Volume Total */}
        <Card
          className={cn(
            'transition-all duration-300 ease-out',
            'hover:border-white/10 hover:bg-zinc-900/60',
            'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
        >
          <CardHeader className='pb-3'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconChartBar className='h-5 w-5' />
              </div>
              <CardDescription className='mb-0'>
                {t('stats.totalVolume')}
              </CardDescription>
            </div>
            <CardTitle className='text-3xl font-bold'>
              {stats.totalVolume.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground/60 text-sm'>
              {t('stats.lotsTraded')}
            </p>
          </CardContent>
        </Card>

        {/* Nombre de Trades */}
        <Card
          className={cn(
            'transition-all duration-300 ease-out',
            'hover:border-white/10 hover:bg-zinc-900/60',
            'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <CardHeader className='pb-3'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconReceipt className='h-5 w-5' />
              </div>
              <CardDescription className='mb-0'>
                {t('stats.trades')}
              </CardDescription>
            </div>
            <CardTitle className='text-3xl font-bold'>
              <AnimatedInteger value={stats.totalTrades} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap items-center gap-2'>
              <RendRBadge variant='success' size='sm' dot dotColor='green'>
                <IconCheck className='mr-1 h-3 w-3' />
                {stats.confirmedTrades} {t('transactions.stats.confirmed')}
              </RendRBadge>
              {stats.pendingTrades > 0 && (
                <RendRBadge variant='outline' size='sm' dot dotColor='yellow'>
                  <IconClock className='mr-1 h-3 w-3' />
                  {stats.pendingTrades} {t('transactions.stats.pending')}
                </RendRBadge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Paires */}
        <Card
          className={cn(
            'transition-all duration-300 ease-out',
            'hover:border-white/10 hover:bg-zinc-900/60',
            'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
        >
          <CardHeader className='pb-3'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconTrendingUp className='h-5 w-5' />
              </div>
              <CardDescription className='mb-0'>
                {t('transactions.popularPairs')}
              </CardDescription>
            </div>
            <CardTitle className='text-xl font-bold'>
              {stats.topPairs.length > 0 ? stats.topPairs[0][0] : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {stats.topPairs.map(([pair, count], index) => (
                <RendRBadge
                  key={pair}
                  variant={index === 0 ? 'accent' : 'outline'}
                  className='font-mono'
                  size='sm'
                >
                  {pair} ({count})
                </RendRBadge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Cashback récent */}
      {stats.recentCashback > 0 && (
        <Alert
          className={cn(
            'border-[#c5d13f]/30 bg-gradient-to-r from-[#c5d13f]/10 to-transparent',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          <IconSparkles className='h-5 w-5 text-[#c5d13f]' />
          <AlertDescription className='flex items-center justify-between'>
            <span>
              <span className='font-semibold text-[#c5d13f]'>
                +{stats.recentCashback.toFixed(2)}€
              </span>{' '}
              {t('transactions.celebration.recentCashback')}
            </span>
            <RendRBadge variant='accent' size='sm'>
              {t('transactions.celebration.last7Days')}
            </RendRBadge>
          </AlertDescription>
        </Alert>
      )}

      {/* Barre de recherche et filtres */}
      <Card
        className={cn(
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
      >
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            {/* Recherche */}
            <div className='relative'>
              <IconReceipt className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder={t('pages.transactions.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full border-white/10 bg-white/5 pr-9 pl-9 focus:border-white/20'
              />
              {searchQuery && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2'
                  onClick={() => setSearchQuery('')}
                >
                  <IconX className='h-3 w-3' />
                </Button>
              )}
            </div>

            {/* Filtres */}
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-2'>
                <IconFilter className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>
                  {t('common.filters')}
                </span>
              </div>

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
                  <SelectItem value='all'>
                    {t('transactions.allTime')}
                  </SelectItem>
                  <SelectItem value='7d'>
                    {t('transactions.last7Days')}
                  </SelectItem>
                  <SelectItem value='30d'>
                    {t('transactions.last30Days')}
                  </SelectItem>
                  <SelectItem value='90d'>
                    {t('transactions.last90Days')}
                  </SelectItem>
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
                className='ml-auto border-white/10 bg-white/5'
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
              >
                <IconDownload className='mr-2 h-4 w-4' />
                {t('common.actions.export')}
              </Button>
            </div>

            {/* Active filters info */}
            {hasActiveFilters && (
              <div className='flex items-center gap-2 border-t border-white/5 pt-4'>
                <span className='text-muted-foreground text-sm'>
                  {t('pages.transactions.filteredResults')}
                </span>
                <RendRBadge variant='accent'>
                  {filteredStats.count} {t('stats.trades')}
                </RendRBadge>
                <span className='text-muted-foreground text-sm'>•</span>
                <span className='text-sm font-semibold text-[#c5d13f]'>
                  +{filteredStats.totalCashback.toFixed(2)}€
                </span>
                <span className='text-muted-foreground text-sm'>•</span>
                <span className='text-muted-foreground text-sm'>
                  {filteredStats.totalVolume.toFixed(2)} {t('stats.lots')}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  className='ml-auto text-xs'
                  onClick={() => {
                    setSelectedBroker('all');
                    setSelectedPeriod('all');
                    setSelectedStatus('all');
                    setSearchQuery('');
                  }}
                >
                  <IconX className='mr-1 h-3 w-3' />
                  {t('pages.transactions.resetFilters')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions - Design en cartes */}
      {isLoading ? (
        <div className='flex items-center justify-center p-12'>
          <div className='text-center'>
            <div className='border-foreground mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent' />
            <p className='text-muted-foreground'>
              {t('pages.transactions.loading')}
            </p>
          </div>
        </div>
      ) : filteredData.length === 0 ? (
        <Card className='border-white/5'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <div className='mb-4 rounded-xl border border-white/5 bg-white/5 p-4'>
              <IconReceipt className='text-muted-foreground h-8 w-8' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>
              {t('pages.transactions.noTransactionsFound')}
            </h3>
            <p className='text-muted-foreground text-center text-sm'>
              {hasActiveFilters
                ? t('pages.transactions.noResultsWithFilters')
                : t('pages.transactions.connectBrokerToSeeTrades')}
            </p>
            {hasActiveFilters && (
              <Button
                variant='outline'
                size='sm'
                className='mt-4'
                onClick={() => {
                  setSelectedBroker('all');
                  setSelectedPeriod('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
              >
                {t('pages.transactions.resetFilters')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className='h-[calc(100vh-600px)]'>
          <div className='space-y-3 pr-4'>
            {filteredData.map((transaction, index) => (
              <TransactionCard
                key={transaction.id || transaction.trade_id || index}
                transaction={transaction}
                index={index}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
