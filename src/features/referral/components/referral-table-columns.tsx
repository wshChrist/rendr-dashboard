'use client';

import { ColumnDef } from '@tanstack/react-table';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

type TFunction = (key: string) => string;

export interface ReferredUser {
  id: string | number;
  name: string;
  joined: string;
  status: 'active' | 'pending';
  earnings: number;
}

export const getReferralColumns = (t: TFunction, locale: string = 'fr'): ColumnDef<ReferredUser>[] => {
  const dateLocale = locale === 'en' ? enUS : fr;
  
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.referral.columns.referred')} />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5 font-semibold'>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className='font-medium'>{user.name}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return String(row.getValue(id))
          .toLowerCase()
          .includes(String(value).toLowerCase());
      },
      enableColumnFilter: true,
      meta: {
        label: t('pages.referral.columns.referred'),
        variant: 'text',
        placeholder: t('pages.referral.searchPlaceholder')
      }
    },
    {
      accessorKey: 'joined',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.referral.columns.joinDate')} />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('joined'));
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
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.referral.columns.status')} />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return status === 'active' ? (
          <RendRBadge variant='success' dot dotColor='green'>
            {t('pages.referral.status.active')}
          </RendRBadge>
        ) : (
          <RendRBadge variant='outline' dot dotColor='yellow'>
            {t('pages.referral.status.pending')}
          </RendRBadge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        return row.getValue(id) === value;
      },
      enableColumnFilter: true,
      meta: {
        label: t('pages.referral.columns.status'),
        variant: 'select',
        options: [
          { label: t('common.all'), value: 'all' },
          { label: t('pages.referral.status.active'), value: 'active' },
          { label: t('pages.referral.status.pending'), value: 'pending' }
        ]
      }
    },
    {
      accessorKey: 'earnings',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pages.referral.columns.earnings')} />
      ),
      cell: ({ row }) => {
        const earnings = parseFloat(row.getValue('earnings'));
        return (
          <span className='stat-number font-semibold text-[#c5d13f]'>
            +{earnings.toFixed(2)}€
          </span>
        );
      }
    }
  ];
};
