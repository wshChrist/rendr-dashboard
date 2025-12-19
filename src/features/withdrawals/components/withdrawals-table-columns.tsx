'use client';

import { ColumnDef } from '@tanstack/react-table';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  IconCreditCard,
  IconBrandPaypal,
  IconCurrencyBitcoin
} from '@tabler/icons-react';
import type { Withdrawal } from '@/types/cashback';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <RendRBadge variant='success' dot dotColor='green'>
          Complété
        </RendRBadge>
      );
    case 'processing':
      return (
        <RendRBadge variant='accent' dot dotColor='yellow'>
          En cours
        </RendRBadge>
      );
    case 'pending':
      return (
        <RendRBadge variant='outline' dot dotColor='white'>
          En attente
        </RendRBadge>
      );
    case 'rejected':
      return (
        <RendRBadge variant='warning' dot dotColor='red'>
          Rejeté
        </RendRBadge>
      );
    default:
      return <RendRBadge variant='muted'>Inconnu</RendRBadge>;
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

const getPaymentLabel = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return 'Virement bancaire';
    case 'paypal':
      return 'PayPal';
    case 'crypto':
      return 'Crypto (USDT)';
    default:
      return method;
  }
};

export const withdrawalsColumns: ColumnDef<Withdrawal>[] = [
  {
    accessorKey: 'payment_method',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Méthode de paiement' />
    ),
    cell: ({ row }) => {
      const method = row.getValue('payment_method') as string;
      return (
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5'>
            {getPaymentIcon(method)}
          </div>
          <span className='font-medium'>{getPaymentLabel(method)}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (value === 'all') return true;
      return row.getValue(id) === value;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Méthode',
      variant: 'select',
      options: [
        { label: 'Toutes', value: 'all' },
        { label: 'Virement bancaire', value: 'bank_transfer' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Crypto (USDT)', value: 'crypto' }
      ]
    }
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Montant' />
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
      <DataTableColumnHeader column={column} title='Statut' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return getStatusBadge(status);
    },
    filterFn: (row, id, value) => {
      if (value === 'all') return true;
      return row.getValue(id) === value;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Statut',
      variant: 'select',
      options: [
        { label: 'Tous', value: 'all' },
        { label: 'Complété', value: 'completed' },
        { label: 'En cours', value: 'processing' },
        { label: 'En attente', value: 'pending' },
        { label: 'Rejeté', value: 'rejected' }
      ]
    }
  },
  {
    accessorKey: 'requested_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date de demande' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('requested_at'));
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>
            {format(date, 'dd MMM yyyy', { locale: fr })}
          </span>
          <span className='text-muted-foreground/60 text-xs'>
            {format(date, 'HH:mm', { locale: fr })}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'processed_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date de traitement' />
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
            {format(date, 'dd MMM yyyy', { locale: fr })}
          </span>
          <span className='text-muted-foreground/60 text-xs'>
            {format(date, 'HH:mm', { locale: fr })}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'payment_details',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Détails' />
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
      <DataTableColumnHeader column={column} title='Référence' />
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
