'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Transaction } from '@/types/cashback';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { IconReceipt, IconCalendar, IconTrendingUp } from '@tabler/icons-react';

interface TransactionMobileViewProps {
  data: Transaction[];
  isLoading?: boolean;
}

// Composant pour afficher le logo du broker avec fallback
function BrokerLogo({
  broker
}: {
  broker: { name: string; logo_url: string };
}) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className='relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-white/5'>
      {!imageError && broker.logo_url ? (
        <img
          src={broker.logo_url}
          alt={broker.name}
          className='h-full w-full object-contain'
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

export function TransactionMobileView({
  data,
  isLoading = false
}: TransactionMobileViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : fr;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>
          {t('pages.transactions.loading')}
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 p-8'>
        <div className='rounded-xl border border-white/5 bg-white/5 p-3'>
          <IconReceipt className='text-muted-foreground h-6 w-6' />
        </div>
        <span className='text-muted-foreground text-center'>
          {t('pages.transactions.noTransactionsFound')}
        </span>
        <span className='text-muted-foreground/60 text-center text-sm'>
          {t('pages.transactions.connectBrokerToSeeTrades')}
        </span>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {data.map((transaction, index) => {
        const date = new Date(transaction.trade_date);
        const isConfirmed = transaction.status === 'confirmed';

        return (
          <div
            key={transaction.trade_id || index}
            className={cn(
              'rounded-xl p-4',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'transition-all duration-300',
              'hover:border-white/8 hover:bg-zinc-900/50',
              'animate-fade-in-up opacity-0'
            )}
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {/* Header avec date et status */}
            <div className='mb-3 flex items-start justify-between'>
              <div className='flex items-center gap-2'>
                <IconCalendar className='text-muted-foreground h-4 w-4' />
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>
                    {format(date, 'dd MMM yyyy', { locale: dateLocale })}
                  </span>
                  <span className='text-muted-foreground/60 text-xs'>
                    {format(date, 'HH:mm', { locale: dateLocale })}
                  </span>
                </div>
              </div>
              {isConfirmed ? (
                <RendRBadge variant='success' dot dotColor='green' size='sm'>
                  {t('pages.transactions.status.confirmed')}
                </RendRBadge>
              ) : (
                <RendRBadge variant='outline' dot dotColor='yellow' size='sm'>
                  {t('pages.transactions.status.pending')}
                </RendRBadge>
              )}
            </div>

            {/* Broker et Pair */}
            <div className='mb-3 flex items-center gap-3'>
              <BrokerLogo broker={transaction.broker} />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>
                  {transaction.broker.name}
                </p>
                <RendRBadge
                  variant='outline'
                  className='mt-1 font-mono text-xs'
                >
                  {transaction.pair}
                </RendRBadge>
              </div>
            </div>

            {/* Stats en grille */}
            <div className='grid grid-cols-3 gap-3 border-t border-white/5 pt-3'>
              <div className='flex flex-col'>
                <span className='text-muted-foreground mb-1 text-xs'>
                  {t('pages.transactions.columns.volume')}
                </span>
                <span className='text-sm font-medium'>
                  {transaction.volume.toFixed(2)}
                </span>
              </div>
              <div className='flex flex-col'>
                <span className='text-muted-foreground mb-1 text-xs'>
                  {t('pages.transactions.columns.commission')}
                </span>
                <span className='text-muted-foreground text-sm'>
                  {transaction.commission.toFixed(2)}€
                </span>
              </div>
              <div className='flex flex-col items-end'>
                <span className='text-muted-foreground mb-1 text-xs'>
                  {t('pages.transactions.columns.cashback')}
                </span>
                <span className='flex items-center gap-1 text-sm font-semibold text-[#c5d13f]'>
                  <IconTrendingUp className='h-3 w-3' />+
                  {transaction.cashback_amount.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
