'use client';

import { ColumnDef } from '@tanstack/react-table';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ReferredUser {
  id: number;
  name: string;
  joined: string;
  status: 'active' | 'pending';
  earnings: number;
}

export const referralColumns: ColumnDef<ReferredUser>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Filleul' />
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
      label: 'Nom',
      variant: 'text',
      placeholder: 'Rechercher un filleul...'
    }
  },
  {
    accessorKey: 'joined',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date d'inscription" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('joined'));
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
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Statut' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return status === 'active' ? (
        <RendRBadge variant='success' dot dotColor='green'>
          Actif
        </RendRBadge>
      ) : (
        <RendRBadge variant='outline' dot dotColor='yellow'>
          En attente
        </RendRBadge>
      );
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
        { label: 'Actif', value: 'active' },
        { label: 'En attente', value: 'pending' }
      ]
    }
  },
  {
    accessorKey: 'earnings',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Gains' />
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
