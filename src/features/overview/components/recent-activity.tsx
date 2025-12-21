'use client';

import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconLink,
  IconCurrencyDollar,
  IconActivity
} from '@tabler/icons-react';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { useTradingData } from '@/hooks/use-trading-data';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'trade':
      return <IconArrowUpRight className='h-4 w-4' />;
    case 'withdrawal':
      return <IconArrowDownRight className='h-4 w-4' />;
    case 'broker_linked':
      return <IconLink className='h-4 w-4' />;
    default:
      return <IconCurrencyDollar className='h-4 w-4' />;
  }
};

const getActivityBadge = (type: string) => {
  switch (type) {
    case 'trade':
      return (
        <RendRBadge variant='accent' size='sm'>
          Trade
        </RendRBadge>
      );
    case 'withdrawal':
      return (
        <RendRBadge variant='default' size='sm'>
          Retrait
        </RendRBadge>
      );
    case 'broker_linked':
      return (
        <RendRBadge variant='outline' size='sm'>
          Broker
        </RendRBadge>
      );
    default:
      return (
        <RendRBadge variant='muted' size='sm'>
          Autre
        </RendRBadge>
      );
  }
};

export function RecentActivity() {
  const { transactions, accounts, isLoading } = useTradingData();

  // Transformer les transactions récentes en format d'activité
  const recentActivities = useMemo(() => {
    return transactions.slice(0, 5).map((transaction) => {
      const account = accounts.find((a) => a.id === transaction.user_broker_id);
      const profit = parseFloat((transaction as any).profit?.toString() || '0');

      return {
        id: transaction.id,
        type: 'trade' as const,
        description: `Trade ${transaction.pair} sur ${transaction.broker.name}`,
        broker: transaction.broker.name,
        date: transaction.trade_date,
        amount: transaction.cashback_amount,
        profit: profit
      };
    });
  }, [transactions, accounts]);

  return (
    <div
      className={cn(
        'h-full rounded-2xl p-5 md:p-6',
        'bg-zinc-900/40 backdrop-blur-sm',
        'border border-white/5',
        'transition-all duration-300',
        'hover:border-white/8 hover:bg-zinc-900/50'
      )}
    >
      {/* Header */}
      <div className='mb-5'>
        <div className='mb-1 flex items-center gap-2'>
          <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
            <IconActivity className='h-4 w-4' />
          </span>
          <h3 className='text-lg font-semibold'>Activité Récente</h3>
        </div>
        <p className='text-muted-foreground text-sm'>
          Vos dernières actions sur la plateforme
        </p>
      </div>

      {/* Activities list */}
      {isLoading ? (
        <div className='flex items-center justify-center p-8'>
          <p className='text-muted-foreground'>Chargement...</p>
        </div>
      ) : recentActivities.length === 0 ? (
        <div className='flex items-center justify-center p-8'>
          <p className='text-muted-foreground'>
            Aucune activité récente pour le moment
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {recentActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                'group flex items-start gap-3',
                'rounded-xl p-3',
                'transition-all duration-200',
                'hover:bg-white/5',
                'animate-fade-in-up opacity-0'
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards'
              }}
            >
              {/* Icône */}
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center',
                  'rounded-xl border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'group-hover:border-white/10 group-hover:bg-white/10'
                )}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Contenu */}
              <div className='min-w-0 flex-1 space-y-1'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='truncate text-sm leading-none font-medium'>
                    {activity.description}
                  </p>
                  {getActivityBadge(activity.type)}
                </div>
                <div className='flex items-center justify-between'>
                  <p className='text-muted-foreground text-xs'>
                    {activity.broker && (
                      <span className='mr-2 text-white/60'>
                        {activity.broker}
                      </span>
                    )}
                    {formatDistanceToNow(new Date(activity.date), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </p>
                  {activity.amount && (
                    <span className='stat-number text-sm font-semibold text-[#c5d13f]'>
                      +{activity.amount.toFixed(2)}€
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
