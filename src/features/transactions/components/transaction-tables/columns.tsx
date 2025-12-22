'use client';

import * as React from 'react';
import { Transaction } from '@/types/cashback';
import { ColumnDef } from '@tanstack/react-table';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant pour afficher le logo du broker avec fallback
function BrokerLogo({
  broker
}: {
  broker: { name: string; logo_url: string };
}) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className='relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white/5'>
      {!imageError && broker.logo_url ? (
        <img
          src={broker.logo_url}
          alt={broker.name}
          className='h-full w-full object-contain p-1.5'
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

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'trade_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('trade_date'));
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
    accessorKey: 'broker',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Broker' />
    ),
    cell: ({ row }) => {
      const broker = row.original.broker;

      return (
        <div className='flex items-center gap-2'>
          <BrokerLogo broker={broker} />
          <span className='font-medium'>{broker.name}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const broker = row.original.broker;
      const brokerName = broker?.name ? String(broker.name).toLowerCase() : '';
      return brokerName.includes(String(value).toLowerCase());
    }
  },
  {
    accessorKey: 'pair',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Paire' />
    ),
    cell: ({ row }) => {
      return (
        <RendRBadge variant='outline' className='font-mono'>
          {row.getValue('pair')}
        </RendRBadge>
      );
    },
    filterFn: (row, id, value) => {
      return String(row.getValue(id))
        .toLowerCase()
        .includes(String(value).toLowerCase());
    }
  },
  {
    accessorKey: 'volume',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Volume' />
    ),
    cell: ({ row }) => {
      const volume = parseFloat(row.getValue('volume'));
      return (
        <span className='stat-number font-medium'>
          {volume.toFixed(2)} lots
        </span>
      );
    }
  },
  {
    accessorKey: 'commission',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Commission' />
    ),
    cell: ({ row }) => {
      const commission = parseFloat(row.getValue('commission'));
      return (
        <span className='text-muted-foreground'>{commission.toFixed(2)}€</span>
      );
    }
  },
  {
    accessorKey: 'cashback_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cashback' />
    ),
    cell: ({ row }) => {
      const cashback = parseFloat(row.getValue('cashback_amount'));
      return (
        <span className='stat-number font-semibold text-[#c5d13f]'>
          +{cashback.toFixed(2)}€
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
      return status === 'confirmed' ? (
        <RendRBadge variant='success' dot dotColor='green'>
          Confirmé
        </RendRBadge>
      ) : (
        <RendRBadge variant='outline' dot dotColor='yellow'>
          En attente
        </RendRBadge>
      );
    }
  }
];
