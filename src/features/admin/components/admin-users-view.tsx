'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  IconUsers,
  IconBuildingBank,
  IconWallet,
  IconArrowsExchange,
  IconSearch,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type User = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  accounts: Array<{
    id: string;
    broker: string;
    platform: string;
    server: string;
    login: string;
    status: string;
    created_at: string;
    external_account_id: string;
  }>;
  cashbackBalances: Array<{
    id: string;
    period: string;
    volume_lots: number;
    cashback_amount: number;
    status: string;
  }>;
  totalCashback: number;
  pendingCashback: number;
  tradesCount: number;
  accountsCount: number;
  connectedAccountsCount: number;
};

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    connected: {
      label: 'Connecté',
      className: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    error: {
      label: 'Erreur',
      className: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    pending_vps_setup: {
      label: 'En attente',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    disconnected: {
      label: 'Déconnecté',
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  };

  const variant = variants[status] || {
    label: status,
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  return (
    <Badge variant='outline' className={cn('text-xs', variant.className)}>
      {variant.label}
    </Badge>
  );
}

export function AdminUsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [editBalanceDialog, setEditBalanceDialog] = useState<{
    open: boolean;
    user: User | null;
    period: string | null;
    currentAmount: number;
  }>({
    open: false,
    user: null,
    period: null,
    currentAmount: 0
  });
  const [newBalanceAmount, setNewBalanceAmount] = useState('');

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (e: any) {
      toast.error('Impossible de charger les utilisateurs', {
        description: e?.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.accounts.some((acc) => acc.broker.toLowerCase().includes(query)) ||
        user.accounts.some((acc) => acc.login.includes(query))
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const openEditBalanceDialog = (
    user: User,
    period: string,
    currentAmount: number
  ) => {
    setEditBalanceDialog({
      open: true,
      user,
      period,
      currentAmount
    });
    setNewBalanceAmount(currentAmount.toString());
  };

  const saveBalance = async () => {
    if (!editBalanceDialog.user || !editBalanceDialog.period) return;

    try {
      const response = await fetch(
        `/api/admin/users/${editBalanceDialog.user.id}/cashback`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period: editBalanceDialog.period,
            cashback_amount: parseFloat(newBalanceAmount)
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      toast.success('Balance mise à jour avec succès');
      setEditBalanceDialog({
        open: false,
        user: null,
        period: null,
        currentAmount: 0
      });
      loadUsers();
    } catch (e: any) {
      toast.error('Erreur', { description: e?.message });
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='h-32 animate-pulse rounded-xl bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Barre de recherche */}
      <div className='relative'>
        <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <Input
          placeholder='Rechercher par email, nom, broker ou login...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Statistiques globales */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div
          className={cn(
            'rounded-xl p-4',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>
            Total utilisateurs
          </div>
          <div className='text-2xl font-bold'>{users.length}</div>
        </div>
        <div
          className={cn(
            'rounded-xl p-4',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>
            Total comptes
          </div>
          <div className='text-2xl font-bold'>
            {users.reduce((sum, u) => sum + u.accountsCount, 0)}
          </div>
        </div>
        <div
          className={cn(
            'rounded-xl p-4',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>
            Cashback total
          </div>
          <div className='text-2xl font-bold text-green-400'>
            {formatCurrency(users.reduce((sum, u) => sum + u.totalCashback, 0))}
          </div>
        </div>
        <div
          className={cn(
            'rounded-xl p-4',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>
            Total trades
          </div>
          <div className='text-2xl font-bold'>
            {users.reduce((sum, u) => sum + u.tradesCount, 0)}
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className='space-y-3'>
        {filteredUsers.map((user) => {
          const isExpanded = expandedUsers.has(user.id);
          return (
            <div
              key={user.id}
              className={cn(
                'rounded-xl p-4 md:p-6',
                'bg-zinc-900/50 backdrop-blur-sm',
                'border border-white/5',
                'transition-colors hover:border-white/10'
              )}
            >
              {/* Header utilisateur */}
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='mb-2 flex items-center gap-3'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <IconUsers className='text-primary h-5 w-5' />
                    </div>
                    <div>
                      <h3 className='font-semibold'>
                        {user.name || 'Sans nom'}
                      </h3>
                      <p className='text-muted-foreground text-sm'>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className='flex flex-wrap gap-4 text-sm'>
                    <div className='flex items-center gap-2'>
                      <IconBuildingBank className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground'>
                        {user.accountsCount} compte
                        {user.accountsCount > 1 ? 's' : ''}
                      </span>
                      {user.connectedAccountsCount > 0 && (
                        <Badge
                          variant='outline'
                          className='border-green-500/30 bg-green-500/20 text-xs text-green-400'
                        >
                          {user.connectedAccountsCount} connecté
                          {user.connectedAccountsCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <IconWallet className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground'>
                        Cashback: {formatCurrency(user.totalCashback)}
                      </span>
                      {user.pendingCashback > 0 && (
                        <Badge
                          variant='outline'
                          className='border-yellow-500/30 bg-yellow-500/20 text-xs text-yellow-400'
                        >
                          {formatCurrency(user.pendingCashback)} en attente
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <IconArrowsExchange className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground'>
                        {user.tradesCount} trade
                        {user.tradesCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Inscrit le {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => toggleUserExpansion(user.id)}
                  className='flex-shrink-0'
                >
                  {isExpanded ? (
                    <IconChevronUp className='h-4 w-4' />
                  ) : (
                    <IconChevronDown className='h-4 w-4' />
                  )}
                </Button>
              </div>

              {/* Contenu expandable */}
              {isExpanded && (
                <div className='mt-4 space-y-4 border-t border-white/5 pt-4'>
                  {/* Comptes de trading */}
                  <div>
                    <h4 className='text-muted-foreground mb-3 text-sm font-semibold'>
                      Comptes de trading
                    </h4>
                    {user.accounts.length === 0 ? (
                      <p className='text-muted-foreground text-sm'>
                        Aucun compte de trading
                      </p>
                    ) : (
                      <div className='grid gap-3 md:grid-cols-2'>
                        {user.accounts.map((account) => (
                          <div
                            key={account.id}
                            className={cn(
                              'rounded-lg p-3',
                              'bg-zinc-900/30 backdrop-blur-sm',
                              'border border-white/5'
                            )}
                          >
                            <div className='mb-2 flex items-start justify-between'>
                              <div>
                                <div className='font-medium'>
                                  {account.broker}
                                </div>
                                <div className='text-muted-foreground text-xs'>
                                  {account.platform} - {account.server}
                                </div>
                              </div>
                              {getStatusBadge(account.status)}
                            </div>
                            <div className='text-muted-foreground mt-2 text-xs'>
                              Login: {account.login}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              ID: {account.external_account_id}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Balances de cashback */}
                  <div>
                    <h4 className='text-muted-foreground mb-3 text-sm font-semibold'>
                      Balances de cashback
                    </h4>
                    {user.cashbackBalances.length === 0 ? (
                      <p className='text-muted-foreground text-sm'>
                        Aucune balance de cashback
                      </p>
                    ) : (
                      <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                          <thead>
                            <tr className='border-b border-white/5 text-left'>
                              <th className='text-muted-foreground pb-2 text-xs font-medium'>
                                Période
                              </th>
                              <th className='text-muted-foreground pb-2 text-right text-xs font-medium'>
                                Volume (lots)
                              </th>
                              <th className='text-muted-foreground pb-2 text-right text-xs font-medium'>
                                Cashback
                              </th>
                              <th className='text-muted-foreground pb-2 text-right text-xs font-medium'>
                                Statut
                              </th>
                              <th className='text-muted-foreground pb-2 text-right text-xs font-medium'>
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.cashbackBalances.map((balance) => (
                              <tr
                                key={balance.id}
                                className='border-b border-white/5 last:border-0'
                              >
                                <td className='py-2'>{balance.period}</td>
                                <td className='py-2 text-right'>
                                  {parseFloat(
                                    balance.volume_lots.toString()
                                  ).toFixed(2)}
                                </td>
                                <td className='py-2 text-right font-medium text-green-400'>
                                  {formatCurrency(
                                    parseFloat(
                                      balance.cashback_amount.toString()
                                    )
                                  )}
                                </td>
                                <td className='py-2 text-right'>
                                  <Badge
                                    variant='outline'
                                    className={
                                      balance.status === 'paid'
                                        ? 'border-green-500/30 bg-green-500/20 text-green-400'
                                        : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                                    }
                                  >
                                    {balance.status === 'paid'
                                      ? 'Payé'
                                      : 'En attente'}
                                  </Badge>
                                </td>
                                <td className='py-2 text-right'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      openEditBalanceDialog(
                                        user,
                                        balance.period,
                                        parseFloat(
                                          balance.cashback_amount.toString()
                                        )
                                      )
                                    }
                                  >
                                    <IconEdit className='h-4 w-4' />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog pour éditer la balance */}
      <Dialog
        open={editBalanceDialog.open}
        onOpenChange={(open) =>
          setEditBalanceDialog({
            ...editBalanceDialog,
            open
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la balance de cashback</DialogTitle>
            <DialogDescription>
              Modifier le montant de cashback pour{' '}
              {editBalanceDialog.user?.email} - Période{' '}
              {editBalanceDialog.period}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='amount'>Montant (€)</Label>
              <Input
                id='amount'
                type='number'
                step='0.01'
                value={newBalanceAmount}
                onChange={(e) => setNewBalanceAmount(e.target.value)}
                placeholder='0.00'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() =>
                setEditBalanceDialog({
                  open: false,
                  user: null,
                  period: null,
                  currentAmount: 0
                })
              }
            >
              <IconX className='mr-2 h-4 w-4' />
              Annuler
            </Button>
            <Button onClick={saveBalance}>
              <IconCheck className='mr-2 h-4 w-4' />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
