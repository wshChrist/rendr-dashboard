'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Withdrawal } from '@/types/cashback';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  IconWallet,
  IconCalendar,
  IconCreditCard,
  IconBrandPaypal,
  IconCurrencyBitcoin
} from '@tabler/icons-react';

interface WithdrawalsMobileViewProps {
  data: Withdrawal[];
  isLoading?: boolean;
}

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return <IconCreditCard className='h-5 w-5' />;
    case 'paypal':
      return <IconBrandPaypal className='h-5 w-5' />;
    case 'crypto':
      return <IconCurrencyBitcoin className='h-5 w-5' />;
    default:
      return <IconWallet className='h-5 w-5' />;
  }
};

const getPaymentLabel = (method: string, t: (key: string) => string) => {
  switch (method) {
    case 'bank_transfer':
      return t('withdrawals.bankTransfer');
    case 'paypal':
      return t('withdrawals.paypal');
    case 'crypto':
      return t('withdrawals.crypto');
    default:
      return method;
  }
};

const getStatusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'completed':
      return (
        <RendRBadge variant='success' dot dotColor='green' size='sm'>
          {t('pages.withdrawals.status.completed')}
        </RendRBadge>
      );
    case 'processing':
      return (
        <RendRBadge variant='accent' dot dotColor='yellow' size='sm'>
          {t('pages.withdrawals.status.processing')}
        </RendRBadge>
      );
    case 'pending':
      return (
        <RendRBadge variant='outline' dot dotColor='white' size='sm'>
          {t('pages.withdrawals.status.pending')}
        </RendRBadge>
      );
    case 'rejected':
      return (
        <RendRBadge variant='warning' dot dotColor='red' size='sm'>
          {t('pages.withdrawals.status.rejected')}
        </RendRBadge>
      );
    default:
      return (
        <RendRBadge variant='outline' size='sm'>
          {status}
        </RendRBadge>
      );
  }
};

export function WithdrawalsMobileView({
  data,
  isLoading = false
}: WithdrawalsMobileViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : fr;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>{t('common.loading')}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 p-8'>
        <div className='rounded-xl border border-white/5 bg-white/5 p-3'>
          <IconWallet className='text-muted-foreground h-6 w-6' />
        </div>
        <span className='text-muted-foreground text-center'>
          {t('pages.withdrawals.noWithdrawalsFound')}
        </span>
        <span className='text-muted-foreground/60 text-center text-sm'>
          {t('pages.withdrawals.withdrawalsWillAppear')}
        </span>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {data.map((withdrawal, index) => {
        const requestedDate = new Date(withdrawal.requested_at);
        const processedDate = withdrawal.processed_at
          ? new Date(withdrawal.processed_at)
          : null;

        return (
          <div
            key={withdrawal.id || index}
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
            {/* Header avec méthode de paiement et statut */}
            <div className='mb-3 flex items-start justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5'>
                  {getPaymentIcon(withdrawal.payment_method)}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>
                    {getPaymentLabel(withdrawal.payment_method, t)}
                  </p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {withdrawal.payment_details}
                  </p>
                </div>
              </div>
              {getStatusBadge(withdrawal.status, t)}
            </div>

            {/* Montant */}
            <div className='mb-3 border-t border-white/5 pt-3'>
              <span className='text-muted-foreground mb-1 block text-xs'>
                {t('pages.withdrawals.columns.amount')}
              </span>
              <span className='text-2xl font-bold'>
                {withdrawal.amount.toFixed(2)}€
              </span>
            </div>

            {/* Dates */}
            <div className='grid grid-cols-2 gap-3 border-t border-white/5 pt-3'>
              <div className='flex flex-col'>
                <span className='text-muted-foreground mb-1 flex items-center gap-1 text-xs'>
                  <IconCalendar className='h-3 w-3' />
                  {t('pages.withdrawals.columns.requestedDate')}
                </span>
                <span className='text-sm font-medium'>
                  {format(requestedDate, 'dd MMM yyyy', { locale: dateLocale })}
                </span>
                <span className='text-muted-foreground/60 text-xs'>
                  {format(requestedDate, 'HH:mm', { locale: dateLocale })}
                </span>
              </div>
              {processedDate && (
                <div className='flex flex-col'>
                  <span className='text-muted-foreground mb-1 flex items-center gap-1 text-xs'>
                    <IconCalendar className='h-3 w-3' />
                    {t('pages.withdrawals.columns.processedDate')}
                  </span>
                  <span className='text-sm font-medium'>
                    {format(processedDate, 'dd MMM yyyy', {
                      locale: dateLocale
                    })}
                  </span>
                  <span className='text-muted-foreground/60 text-xs'>
                    {format(processedDate, 'HH:mm', { locale: dateLocale })}
                  </span>
                </div>
              )}
            </div>

            {/* Référence transaction */}
            {withdrawal.transaction_ref && (
              <div className='mt-3 border-t border-white/5 pt-3'>
                <span className='text-muted-foreground mb-1 block text-xs'>
                  {t('pages.withdrawals.columns.transactionRef')}
                </span>
                <span className='text-muted-foreground font-mono text-xs break-all'>
                  {withdrawal.transaction_ref}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
