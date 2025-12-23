'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  IconCheck,
  IconClock,
  IconSearch,
  IconX
} from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

type AdminWithdrawal = {
  id: string;
  user_id: string;
  amount: number;
  status: WithdrawalStatus;
  payment_method: string;
  payment_details: string;
  requested_at: string;
  processed_at: string | null;
  transaction_ref: string | null;
  user?: { email?: string | null; name?: string | null } | null;
};

function StatusBadge({ status }: { status: WithdrawalStatus }) {
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
  }
}

async function patchWithdrawal(input: {
  id: string;
  status: WithdrawalStatus;
  transaction_ref?: string | null;
}) {
  const res = await fetch('/api/admin/withdrawals', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la mise à jour');
  }
  return json as AdminWithdrawal;
}

export function AdminWithdrawalsView() {
  const [data, setData] = React.useState<AdminWithdrawal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'requested_at', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erreur de chargement');
      setData(json);
    } catch (e: any) {
      toast.error('Impossible de charger les retraits', {
        description: e?.message
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const columns = React.useMemo<ColumnDef<AdminWithdrawal>[]>(
    () => [
      {
        id: 'user',
        header: 'Utilisateur',
        cell: ({ row }) => {
          const email = row.original.user?.email ?? '—';
          const name = row.original.user?.name ?? null;
          return (
            <div className='flex flex-col'>
              <span className='font-medium'>{email}</span>
              {name ? (
                <span className='text-muted-foreground/70 text-xs'>{name}</span>
              ) : null}
            </div>
          );
        },
        filterFn: (row, _id, value) => {
          const v = String(value ?? '').toLowerCase();
          const email = String(row.original.user?.email ?? '').toLowerCase();
          const name = String(row.original.user?.name ?? '').toLowerCase();
          return email.includes(v) || name.includes(v);
        }
      },
      {
        accessorKey: 'amount',
        header: 'Montant',
        cell: ({ row }) => (
          <span className='stat-number font-semibold'>
            {row.original.amount.toFixed(2)}€
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        accessorKey: 'requested_at',
        header: 'Demandé le',
        cell: ({ row }) => {
          const d = new Date(row.original.requested_at);
          return (
            <div className='flex flex-col'>
              <span className='font-medium'>
                {format(d, 'dd MMM yyyy', { locale: fr })}
              </span>
              <span className='text-muted-foreground/60 text-xs'>
                {format(d, 'HH:mm', { locale: fr })}
              </span>
            </div>
          );
        }
      },
      {
        accessorKey: 'payment_details',
        header: 'Paiement',
        cell: ({ row }) => (
          <span className='text-muted-foreground font-mono text-xs'>
            {row.original.payment_details}
          </span>
        ),
        filterFn: (row, _id, value) => {
          const v = String(value ?? '').toLowerCase();
          return String(row.original.payment_details ?? '')
            .toLowerCase()
            .includes(v);
        }
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const w = row.original;
          const disabled = updatingId === w.id;

          const onProcessing = async () => {
            setUpdatingId(w.id);
            try {
              const updated = await patchWithdrawal({
                id: w.id,
                status: 'processing'
              });
              setData((prev) => prev.map((x) => (x.id === w.id ? updated : x)));
              toast.success('Retrait mis en cours');
            } catch (e: any) {
              toast.error('Impossible de mettre en cours', {
                description: e?.message
              });
            } finally {
              setUpdatingId(null);
            }
          };

          const onApprove = async () => {
            const ref = window.prompt(
              'Référence de transaction (virement / paypal / hash crypto) :'
            );
            if (!ref || ref.trim() === '') return;

            setUpdatingId(w.id);
            try {
              const updated = await patchWithdrawal({
                id: w.id,
                status: 'completed',
                transaction_ref: ref.trim()
              });
              setData((prev) => prev.map((x) => (x.id === w.id ? updated : x)));
              toast.success('Retrait validé');
            } catch (e: any) {
              toast.error('Impossible de valider', { description: e?.message });
            } finally {
              setUpdatingId(null);
            }
          };

          const onReject = async () => {
            const ok = window.confirm(
              'Confirmer le rejet de cette demande de retrait ?'
            );
            if (!ok) return;

            setUpdatingId(w.id);
            try {
              const updated = await patchWithdrawal({
                id: w.id,
                status: 'rejected'
              });
              setData((prev) => prev.map((x) => (x.id === w.id ? updated : x)));
              toast.success('Retrait rejeté');
            } catch (e: any) {
              toast.error('Impossible de rejeter', { description: e?.message });
            } finally {
              setUpdatingId(null);
            }
          };

          const showActions = w.status === 'pending' || w.status === 'processing';

          return (
            <div className='flex items-center justify-end gap-2'>
              {showActions ? (
                <>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={onProcessing}
                    disabled={disabled || w.status === 'processing'}
                    className='border-white/10 bg-white/5 hover:bg-white/10'
                  >
                    <IconClock className='mr-2 h-4 w-4' />
                    En cours
                  </Button>
                  <Button size='sm' onClick={onApprove} disabled={disabled}>
                    <IconCheck className='mr-2 h-4 w-4' />
                    Valider
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={onReject}
                    disabled={disabled}
                    className='border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200'
                  >
                    <IconX className='mr-2 h-4 w-4' />
                    Rejeter
                  </Button>
                </>
              ) : (
                <span className='text-muted-foreground text-xs'>
                  Action indisponible
                </span>
              )}
            </div>
          );
        }
      }
    ],
    [updatingId]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const v = String(filterValue ?? '').toLowerCase();
      if (!v) return true;
      const email = String(row.original.user?.email ?? '').toLowerCase();
      const name = String(row.original.user?.name ?? '').toLowerCase();
      const details = String(row.original.payment_details ?? '').toLowerCase();
      const status = String(row.original.status ?? '').toLowerCase();
      const amount = String(row.original.amount ?? '');
      return (
        email.includes(v) ||
        name.includes(v) ||
        details.includes(v) ||
        status.includes(v) ||
        amount.includes(v)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  if (isLoading) {
    return (
      <div className='rounded-2xl border border-white/5 bg-zinc-900/40 p-6'>
        <p className='text-muted-foreground text-sm'>Chargement…</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='relative max-w-md flex-1'>
          <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Rechercher un email, statut, montant…'
            className='border-white/10 bg-white/5 pl-9 focus:border-white/20'
          />
        </div>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground text-sm'>
            {table.getFilteredRowModel().rows.length} retrait(s)
          </span>
          <Button
            variant='outline'
            className='border-white/10 bg-white/5 hover:bg-white/10'
            onClick={() => load()}
          >
            Rafraîchir
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-2xl',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50'
        )}
      >
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className='border-white/5 hover:bg-transparent'
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className='text-muted-foreground'>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className='border-white/5 hover:bg-white/5'
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className='border-white/5'>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className='h-28 text-center'
                  >
                    <span className='text-muted-foreground text-sm'>
                      Aucun retrait.
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

