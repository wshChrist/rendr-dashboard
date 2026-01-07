'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RendRBadge } from '@/components/ui/rendr-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconUser,
  IconServer,
  IconKey,
  IconCalendar
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

type TradingAccount = {
  id: string;
  user_id: string;
  broker: string;
  platform: string;
  server: string;
  login: string;
  external_account_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

async function fetchPendingAccounts(): Promise<TradingAccount[]> {
  const res = await fetch(
    '/api/admin/trading-accounts?status=pending_approval'
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors du chargement');
  }
  return json as TradingAccount[];
}

async function approveOrRejectAccount(
  accountId: string,
  action: 'approve' | 'reject',
  reason?: string
) {
  const res = await fetch('/api/admin/trading-accounts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: accountId,
      action,
      reason
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la mise à jour');
  }
  return json;
}

// Dialog pour rejeter un compte
function RejectAccountDialog({
  account,
  isOpen,
  onOpenChange,
  onSuccess
}: {
  account: TradingAccount | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations();
  const [reason, setReason] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleReject = async () => {
    if (!account) return;

    setIsProcessing(true);
    try {
      await approveOrRejectAccount(account.id, 'reject', reason || undefined);
      toast.success('Compte rejeté');
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast.error('Impossible de rejeter le compte', {
        description: e?.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
              <IconX className='text-destructive h-4 w-4' />
            </div>
            Rejeter le compte
          </DialogTitle>
          <DialogDescription>
            Le compte de {account.users?.name || account.users?.email} sera
            rejeté.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='reason'>Raison du rejet (optionnel)</Label>
            <Textarea
              id='reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className='min-h-[100px] border-white/10 bg-white/5'
              placeholder='Expliquez pourquoi ce compte est rejeté...'
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant='destructive'
            onClick={handleReject}
            disabled={isProcessing}
          >
            {isProcessing ? t('common.processing') : 'Rejeter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminAccountsApprovalView() {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : fr;
  const [accounts, setAccounts] = React.useState<TradingAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedAccount, setSelectedAccount] =
    React.useState<TradingAccount | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPendingAccounts();
      setAccounts(data);
    } catch (e: any) {
      toast.error('Impossible de charger les comptes', {
        description: e?.message
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (account: TradingAccount) => {
    try {
      await approveOrRejectAccount(account.id, 'approve');
      toast.success('Compte approuvé avec succès');
      load();
    } catch (e: any) {
      toast.error("Impossible d'approuver le compte", {
        description: e?.message
      });
    }
  };

  const handleRejectClick = (account: TradingAccount) => {
    setSelectedAccount(account);
    setIsRejectDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className='rounded-2xl border border-white/5 bg-zinc-900/40 p-6'>
        <p className='text-muted-foreground text-sm'>Chargement…</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className='rounded-2xl border border-white/5 bg-zinc-900/40 p-8 text-center'>
        <div className='mb-4 flex justify-center'>
          <div className='rounded-xl border border-white/5 bg-white/5 p-4'>
            <IconCheck className='text-muted-foreground h-8 w-8' />
          </div>
        </div>
        <h3 className='mb-2 text-lg font-semibold'>Aucun compte en attente</h3>
        <p className='text-muted-foreground text-sm'>
          Tous les comptes ont été traités.
        </p>
      </div>
    );
  }

  return (
    <div className='w-full max-w-full space-y-4 overflow-x-hidden'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='mb-1 text-lg font-semibold'>
            Comptes en attente d'approbation
          </h2>
          <p className='text-muted-foreground text-sm'>
            {accounts.length} compte{accounts.length > 1 ? 's' : ''} en attente
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          className='flex-shrink-0 border-white/10 bg-white/5 hover:bg-white/10'
          onClick={() => load()}
        >
          <IconRefresh className='mr-2 h-4 w-4' />
          Rafraîchir
        </Button>
      </div>

      {/* Liste des comptes */}
      <div className='space-y-3'>
        {accounts.map((account) => {
          const createdAt = new Date(account.created_at);
          const user = account.users;

          return (
            <div
              key={account.id}
              className={cn(
                'rounded-xl p-4',
                'bg-zinc-900/40 backdrop-blur-sm',
                'border border-white/5',
                'transition-all duration-300',
                'hover:border-white/10 hover:bg-zinc-900/50'
              )}
            >
              <div className='flex flex-col gap-4'>
                {/* Header avec infos utilisateur */}
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg border border-white/10 bg-white/5 p-2'>
                      <IconUser className='h-4 w-4' />
                    </div>
                    <div>
                      <p className='font-medium'>
                        {user?.name || user?.email || 'Utilisateur inconnu'}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <RendRBadge variant='warning' size='sm'>
                    En attente
                  </RendRBadge>
                </div>

                {/* Détails du compte */}
                <div className='grid grid-cols-1 gap-3 border-t border-white/5 pt-4 sm:grid-cols-2'>
                  <div className='flex items-center gap-2'>
                    <IconServer className='text-muted-foreground h-4 w-4' />
                    <div>
                      <p className='text-muted-foreground text-xs'>Broker</p>
                      <p className='text-sm font-medium'>{account.broker}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <IconKey className='text-muted-foreground h-4 w-4' />
                    <div>
                      <p className='text-muted-foreground text-xs'>
                        Plateforme
                      </p>
                      <p className='text-sm font-medium'>{account.platform}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <IconServer className='text-muted-foreground h-4 w-4' />
                    <div>
                      <p className='text-muted-foreground text-xs'>Serveur</p>
                      <p className='text-sm font-medium'>{account.server}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <IconKey className='text-muted-foreground h-4 w-4' />
                    <div>
                      <p className='text-muted-foreground text-xs'>Login</p>
                      <p className='text-sm font-medium'>{account.login}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <IconCalendar className='text-muted-foreground h-4 w-4' />
                    <div>
                      <p className='text-muted-foreground text-xs'>
                        Date de création
                      </p>
                      <p className='text-sm font-medium'>
                        {format(createdAt, 'dd MMM yyyy HH:mm', {
                          locale: dateLocale
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className='flex items-center justify-end gap-2 border-t border-white/5 pt-4'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-destructive/20 text-destructive hover:bg-destructive/10'
                    onClick={() => handleRejectClick(account)}
                  >
                    <IconX className='mr-2 h-4 w-4' />
                    Rejeter
                  </Button>
                  <Button
                    size='sm'
                    className='bg-[#c5d13f] text-black hover:bg-[#b8c438]'
                    onClick={() => handleApprove(account)}
                  >
                    <IconCheck className='mr-2 h-4 w-4' />
                    Approuver
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog de rejet */}
      <RejectAccountDialog
        account={selectedAccount}
        isOpen={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onSuccess={load}
      />
    </div>
  );
}
