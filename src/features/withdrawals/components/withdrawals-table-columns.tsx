'use client';

import { ColumnDef } from '@tanstack/react-table';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  IconCreditCard,
  IconBrandPaypal,
  IconCurrencyBitcoin
} from '@tabler/icons-react';
import type { Withdrawal } from '@/types/cashback';
import type { useTranslations } from 'next-intl';

type TFunction = ReturnType<typeof useTranslations>;

const getStatusBadge = (status: string, t: TFunction) => {
  switch (status) {
    case 'completed':
      return (
        <RendRBadge variant='success' dot dotColor='green'>
          {t('pages.withdrawals.status.completed')}
        </RendRBadge>
      );
    case 'processing':
      return (
        <RendRBadge variant='accent' dot dotColor='yellow'>
          {t('pages.withdrawals.status.processing')}
        </RendRBadge>
      );
    case 'pending':
      return (
        <RendRBadge variant='outline' dot dotColor='white'>
          {t('pages.withdrawals.status.pending')}
        </RendRBadge>
      );
    case 'rejected':
      return (
        <RendRBadge variant='warning' dot dotColor='red'>
          {t('pages.withdrawals.status.rejected')}
        </RendRBadge>
      );
    default:
      return <RendRBadge variant='muted'>{t('common.unknown')}</RendRBadge>;
  }
};

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return <IconCreditCard className='h-4 w-4' />;
    case 'paypal':
      return <IconBrandPaypal className='h-4 w-4' />;
    case 'crypto':
      return <IconCurrencyBitcoin className='h-4 w-4' />;
    default:
      return <IconCreditCard className='h-4 w-4' />;
  }
};

const getPaymentLabel = (method: string, t: TFunction) => {
  switch (method) {
    case 'bank_transfer':
      return t('pages.withdrawals.paymentMethods.bankTransfer');
    case 'paypal':
      return t('pages.withdrawals.paymentMethods.paypal');
    case 'crypto':
      return t('pages.withdrawals.paymentMethods.crypto');
    default:
      return method;
  }
};

export const getWithdrawalsColumns = (t: TFunction, locale: string = 'fr'): ColumnDef<Withdrawal>[] => {
  const dateLocale = locale === 'en' ? enUS : fr;
  
  return [
    {
      accessorKey: 'payment_method',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.withdrawals.columns.paymentMethod')} />
      ),
      cell: ({ row }) => {
        const method = row.getValue('payment_method') as string;
        return (
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5'>
              {getPaymentIcon(method)}
            </div>
            <span className='font-medium'>{getPaymentLabel(method, t)}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        return row.getValue(id) === value;
      },
      enableColumnFilter: true,
      meta: {
        label: t('pages.withdrawals.columns.paymentMethod'),
        variant: 'select',
        options: [
          { label: t('pages.withdrawals.paymentMethods.all'), value: 'all' },
          { label: t('pages.withdrawals.paymentMethods.bankTransfer'), value: 'bank_transfer' },
          { label: t('pages.withdrawals.paymentMethods.paypal'), value: 'paypal' },
          { label: t('pages.withdrawals.paymentMethods.crypto'), value: 'crypto' }
        ]
      }
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.withdrawals.columns.amount')} />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        return (
          <span className='text-foreground stat-number font-semibold'>
            {amount.toFixed(2)}€
          </span>
        );
      }
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.withdrawals.columns.status')} />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return getStatusBadge(status, t);
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        return row.getValue(id) === value;
      },
      enableColumnFilter: true,
      meta: {
        label: t('pages.withdrawals.columns.status'),
        variant: 'select',
        options: [
          { label: t('common.all'), value: 'all' },
          { label: t('pages.withdrawals.status.completed'), value: 'completed' },
          { label: t('pages.withdrawals.status.processing'), value: 'processing' },
          { label: t('pages.withdrawals.status.pending'), value: 'pending' },
          { label: t('pages.withdrawals.status.rejected'), value: 'rejected' }
        ]
      }
    },
    {
      accessorKey: 'requested_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.withdrawals.columns.requestDate')} />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('requested_at'));
        return (
          <div className='flex flex-col'>
            <span className='font-medium'>
              {format(date, 'dd MMM yyyy', { locale: dateLocale })}
            </span>
            <span className='text-muted-foreground/60 text-xs'>
              {format(date, 'HH:mm', { locale: dateLocale })}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'processed_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.withdrawals.columns.processedDate')} />
      ),
      cell: ({ row }) => {
        const processedAt = row.original.processed_at;
        if (!processedAt) {
          return <span className='text-muted-foreground/60 text-sm'>-</span>;
        }
        const date = new Date(processedAt);
        return (
          <div className='flex flex-col'>
            <span className='font-medium'>
              {format(date, 'dd MMM yyyy', { locale: dateLocale })}
            </span>
            <span className='text-muted-foreground/60 text-xs'>
              {format(date, 'HH:mm', { locale: dateLocale })}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'payment_details',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.withdrawals.columns.details')} />
      ),
      cell: ({ row }) => {
        const details = row.getValue('payment_details') as string;
        return (
          <span className='text-muted-foreground font-mono text-sm'>
            {details}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return String(row.getValue(id))
          .toLowerCase()
          .includes(String(value).toLowerCase());
      }
    },
    {
      accessorKey: 'transaction_ref',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.withdrawals.columns.reference')} />
      ),
      cell: ({ row }) => {
        const ref = row.original.transaction_ref;
        if (!ref) {
          return <span className='text-muted-foreground/60 text-sm'>-</span>;
        }
        return (
          <span className='text-muted-foreground font-mono text-xs'>{ref}</span>
        );
      },
      filterFn: (row, id, value) => {
        const ref = row.original.transaction_ref;
        if (!ref) return false;
        return String(ref).toLowerCase().includes(String(value).toLowerCase());
      }
    }
  ];
};

