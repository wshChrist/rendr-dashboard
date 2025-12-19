'use client';

import * as React from 'react';
import { referralColumns, type ReferredUser } from './referral-table-columns';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  flexRender
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconUsers
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ReferralTableProps {
  data: ReferredUser[];
}

export function ReferralTable({ data }: ReferralTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'joined', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns: referralColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  return (
    <div className='space-y-4'>
      {/* Toolbar */}
      <div
        className='animate-fade-in-up flex flex-col gap-4 opacity-0 md:flex-row md:items-center md:justify-between'
        style={{ animationFillMode: 'forwards' }}
      >
        <div className='relative max-w-sm flex-1'>
          <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Rechercher un filleul...'
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className='border-white/10 bg-white/5 pl-9 focus:border-white/20'
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>
            {table.getFilteredRowModel().rows.length} filleul
            {table.getFilteredRowModel().rows.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div
        className={cn(
          'overflow-hidden rounded-2xl',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
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
                    <TableHead
                      key={header.id}
                      className='text-muted-foreground'
                    >
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
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className='animate-fade-in-up border-white/5 opacity-0 hover:bg-white/5'
                    style={{
                      animationDelay: `${150 + index * 30}ms`,
                      animationFillMode: 'forwards'
                    }}
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
                    colSpan={referralColumns.length}
                    className='h-32 text-center'
                  >
                    <div className='flex flex-col items-center gap-3'>
                      <div className='rounded-xl border border-white/5 bg-white/5 p-3'>
                        <IconUsers className='text-muted-foreground h-6 w-6' />
                      </div>
                      <span className='text-muted-foreground'>
                        Aucun filleul trouvé
                      </span>
                      <span className='text-muted-foreground/60 text-sm'>
                        Partagez votre lien pour commencer à gagner !
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {table.getFilteredRowModel().rows.length > 0 && (
        <div
          className='animate-fade-in-up flex flex-col gap-4 opacity-0 md:flex-row md:items-center md:justify-between'
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>
              Lignes par page
            </span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className='h-8 w-[70px] border-white/10 bg-white/5'>
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side='top'>
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>
              Page {table.getState().pagination.pageIndex + 1} sur{' '}
              {table.getPageCount()}
            </span>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 border-white/10 bg-white/5 hover:bg-white/10'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 border-white/10 bg-white/5 hover:bg-white/10'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
