'use client';

import { userBrokersData, transactionsData } from '@/constants/cashback-data';
import { Button } from '@/components/ui/button';
import {
  IconExternalLink,
  IconRefresh,
  IconTrash,
  IconChartBar,
  IconCash,
  IconPlus,
  IconTrendingUp,
  IconActivity,
  IconCalendar,
  IconPercentage,
  IconWallet,
  IconArrowRight
} from '@tabler/icons-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { toast } from 'sonner';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <RendRBadge variant='success' dot dotColor='green'>
          Actif
        </RendRBadge>
      );
    case 'pending':
      return (
        <RendRBadge variant='accent' dot dotColor='yellow'>
          En attente
        </RendRBadge>
      );
    case 'inactive':
      return <RendRBadge variant='muted'>Inactif</RendRBadge>;
    default:
      return <RendRBadge variant='outline'>Inconnu</RendRBadge>;
  }
};

export function MyBrokers() {
  // Calcul des stats globales
  const globalStats = useMemo(() => {
    const totalCashback = userBrokersData.reduce(
      (acc, ub) => acc + ub.total_cashback,
      0
    );
    const totalVolume = userBrokersData.reduce(
      (acc, ub) => acc + ub.total_volume,
      0
    );
    const activeBrokers = userBrokersData.filter(
      (ub) => ub.status === 'active'
    ).length;
    const totalTrades = transactionsData.filter((t) =>
      userBrokersData.some((ub) => ub.id === t.user_broker_id)
    ).length;

    return {
      totalCashback,
      totalVolume,
      activeBrokers,
      totalTrades,
      avgCashbackPerBroker: totalCashback / userBrokersData.length,
      avgVolumePerBroker: totalVolume / userBrokersData.length
    };
  }, []);

  // Stats par broker
  const brokerStats = useMemo(() => {
    return userBrokersData.map((ub) => {
      const brokerTrades = transactionsData.filter(
        (t) => t.user_broker_id === ub.id
      );
      const recentTrades = brokerTrades
        .sort(
          (a, b) =>
            new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
        )
        .slice(0, 3);

      const avgCashbackPerTrade =
        brokerTrades.length > 0 ? ub.total_cashback / brokerTrades.length : 0;
      const avgVolumePerTrade =
        brokerTrades.length > 0 ? ub.total_volume / brokerTrades.length : 0;
      const cashbackPerLot =
        ub.total_volume > 0 ? ub.total_cashback / ub.total_volume : 0;

      const lastActivity =
        brokerTrades.length > 0 ? brokerTrades[0].trade_date : ub.linked_at;

      return {
        ...ub,
        tradeCount: brokerTrades.length,
        recentTrades,
        avgCashbackPerTrade,
        avgVolumePerTrade,
        cashbackPerLot,
        lastActivity
      };
    });
  }, []);

  if (userBrokersData.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl p-8 md:p-12',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className='flex flex-col items-center justify-center'>
          <div className='animate-pulse-subtle mb-4 rounded-2xl border border-white/5 bg-white/5 p-4'>
            <IconChartBar className='text-muted-foreground h-8 w-8' />
          </div>
          <h3 className='mb-2 text-lg font-semibold'>Aucun broker connecté</h3>
          <p className='text-muted-foreground mb-4 max-w-md text-center'>
            Connectez votre premier compte de trading pour commencer à recevoir
            du cashback
          </p>
          <Button asChild>
            <Link href='/dashboard/brokers/available'>
              <IconPlus className='mr-2 h-4 w-4' />
              Découvrir nos brokers partenaires
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Globales */}
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
              Cashback Total
            </span>
          </div>
          <p className='stat-number text-3xl font-bold text-[#c5d13f]'>
            +{globalStats.totalCashback.toFixed(2)}€
          </p>
          <p className='text-muted-foreground/60 mt-1 text-sm'>
            ~{globalStats.avgCashbackPerBroker.toFixed(2)}€ par compte
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
            {globalStats.totalVolume.toFixed(2)}
          </p>
          <p className='text-muted-foreground/60 mt-1 text-sm'>lots tradés</p>
        </div>

        {/* Comptes Actifs */}
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
              <IconWallet className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>Comptes</span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {globalStats.activeBrokers}
          </p>
          <div className='mt-1 flex items-center gap-2'>
            <RendRBadge variant='success' size='sm' dot dotColor='green'>
              {globalStats.activeBrokers} actifs
            </RendRBadge>
            {userBrokersData.length - globalStats.activeBrokers > 0 && (
              <RendRBadge variant='outline' size='sm'>
                {userBrokersData.length - globalStats.activeBrokers} autres
              </RendRBadge>
            )}
          </div>
        </div>

        {/* Total Trades */}
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
              <IconActivity className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>Trades</span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {globalStats.totalTrades}
          </p>
          <p className='text-muted-foreground/60 mt-1 text-sm'>tous comptes</p>
        </div>
      </div>

      {/* Liste des Comptes */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {brokerStats.map((broker, index) => (
          <div
            key={broker.id}
            className={cn(
              'relative overflow-hidden rounded-2xl p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border transition-all duration-300',
              broker.status === 'active'
                ? 'border-white/5 hover:border-white/10'
                : 'border-white/5',
              'hover:bg-zinc-900/50',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              'animate-fade-in-up opacity-0'
            )}
            style={{
              animationDelay: `${200 + index * 100}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {/* Header avec badge */}
            <div className='mb-6 flex items-start justify-between'>
              <div className='flex items-center gap-4'>
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-xl',
                    'border border-white/5 bg-white/5',
                    'text-xl font-bold transition-transform duration-300',
                    'hover:scale-105'
                  )}
                >
                  {broker.broker.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className='mb-1 text-xl font-semibold'>
                    {broker.broker.name}
                  </h3>
                  <div className='flex items-center gap-2'>
                    <p className='text-muted-foreground font-mono text-xs'>
                      {broker.account_id}
                    </p>
                    <span className='text-muted-foreground/40'>•</span>
                    <p className='text-muted-foreground/60 text-xs'>
                      Connecté{' '}
                      {formatDistanceToNow(new Date(broker.linked_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                  </div>
                </div>
              </div>
              {getStatusBadge(broker.status)}
            </div>

            {/* Stats principales */}
            <div className='mb-6 grid grid-cols-2 gap-4'>
              <div
                className={cn(
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='mb-2 flex items-center gap-2'>
                  <IconCash className='h-4 w-4 text-[#c5d13f]' />
                  <span className='text-muted-foreground text-xs'>
                    Cashback Total
                  </span>
                </div>
                <p className='stat-number text-2xl font-bold text-[#c5d13f]'>
                  {broker.total_cashback.toFixed(2)}€
                </p>
                <p className='text-muted-foreground/60 mt-1 text-xs'>
                  {broker.cashbackPerLot > 0 &&
                    `~${broker.cashbackPerLot.toFixed(2)}€/lot`}
                </p>
              </div>

              <div
                className={cn(
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='mb-2 flex items-center gap-2'>
                  <IconChartBar className='h-4 w-4' />
                  <span className='text-muted-foreground text-xs'>
                    Volume Tradé
                  </span>
                </div>
                <p className='stat-number text-2xl font-bold'>
                  {broker.total_volume.toFixed(1)}
                </p>
                <p className='text-muted-foreground/60 mt-1 text-xs'>lots</p>
              </div>
            </div>

            {/* Métriques détaillées */}
            <div className='mb-6 grid grid-cols-3 gap-3'>
              <div className='text-center'>
                <p className='text-muted-foreground mb-1 text-xs'>Trades</p>
                <p className='stat-number text-lg font-bold'>
                  {broker.tradeCount}
                </p>
              </div>
              <div className='border-x border-white/5 text-center'>
                <p className='text-muted-foreground mb-1 text-xs'>
                  Moy. / Trade
                </p>
                <p className='stat-number text-lg font-bold text-[#c5d13f]'>
                  {broker.avgCashbackPerTrade > 0
                    ? `+${broker.avgCashbackPerTrade.toFixed(2)}€`
                    : '—'}
                </p>
              </div>
              <div className='text-center'>
                <p className='text-muted-foreground mb-1 text-xs'>Taux</p>
                <p className='text-lg font-bold text-[#c5d13f]'>
                  {(broker.broker.cashback_rate * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Dernière activité */}
            {broker.recentTrades.length > 0 && (
              <div className='mb-6'>
                <div className='mb-3 flex items-center gap-2'>
                  <IconActivity className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Dernière activité</span>
                </div>
                <div className='space-y-2'>
                  {broker.recentTrades.slice(0, 2).map((trade) => (
                    <div
                      key={trade.id}
                      className={cn(
                        'flex items-center justify-between',
                        'rounded-lg p-2',
                        'border border-white/5 bg-white/5',
                        'transition-all duration-200',
                        'hover:bg-white/10'
                      )}
                    >
                      <div className='flex items-center gap-2'>
                        <RendRBadge
                          variant='outline'
                          size='sm'
                          className='font-mono text-xs'
                        >
                          {trade.pair}
                        </RendRBadge>
                        <span className='text-muted-foreground text-xs'>
                          {format(new Date(trade.trade_date), 'dd MMM', {
                            locale: fr
                          })}
                        </span>
                      </div>
                      <span className='text-sm font-semibold text-[#c5d13f]'>
                        +{trade.cashback_amount.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className='flex gap-2 border-t border-white/5 pt-4'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1'
                onClick={() => {
                  toast.info(
                    `Synchronisation de ${broker.broker.name} ajoutée à la file d'attente`,
                    {
                      description:
                        'Votre compte sera synchronisé dans quelques instants.',
                      duration: 4000
                    }
                  );
                }}
              >
                <IconRefresh className='mr-2 h-4 w-4' />
                Synchroniser
              </Button>
              <Button variant='ghost' size='sm' className='hover:bg-white/5'>
                <IconExternalLink className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='text-red-400 hover:bg-red-500/10 hover:text-red-300'
              >
                <IconTrash className='h-4 w-4' />
              </Button>
            </div>
          </div>
        ))}

        {/* Card pour ajouter un nouveau broker */}
        <Link href='/dashboard/brokers/available' className='group'>
          <div
            className={cn(
              'h-full rounded-2xl p-6',
              'bg-zinc-900/20 backdrop-blur-sm',
              'border border-dashed border-white/10',
              'transition-all duration-300',
              'hover:border-white/20 hover:bg-zinc-900/40',
              'hover:-translate-y-1',
              'animate-fade-in-up opacity-0'
            )}
            style={{
              animationDelay: `${200 + brokerStats.length * 100}ms`,
              animationFillMode: 'forwards'
            }}
          >
            <div className='flex h-full flex-col items-center justify-center py-12'>
              <div className='mb-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/10'>
                <IconPlus className='text-muted-foreground group-hover:text-foreground h-8 w-8 transition-colors' />
              </div>
              <h3 className='group-hover:text-foreground mb-2 text-lg font-semibold transition-colors'>
                Ajouter un broker
              </h3>
              <p className='text-muted-foreground mb-6 max-w-xs text-center text-sm transition-colors'>
                Découvrez nos brokers partenaires et connectez un nouveau compte
                pour maximiser vos gains
              </p>
              <Button
                variant='outline'
                className='pointer-events-none group-hover:border-white/20'
              >
                <IconPlus className='mr-2 h-4 w-4' />
                Voir les brokers
                <IconArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
