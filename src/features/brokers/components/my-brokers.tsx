'use client';

import { useState, useEffect, useRef } from 'react';
import {
  userBrokersData,
  transactionsData,
  brokersData
} from '@/constants/cashback-data';
import { calculateCashbackForTrade } from '@/lib/utils/broker-cashback';
import { Button } from '@/components/ui/button';
import { CreateTradingAccountForm } from '@/features/trading-accounts/components/create-trading-account-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { backendClient } from '@/lib/api/backend-client';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  IconExternalLink,
  IconRefresh,
  IconTrash,
  IconChartBar,
  IconCash,
  IconPlus,
  IconTrendingUp,
  IconActivity,
  IconCalendar,
  IconPercentage,
  IconWallet,
  IconArrowRight
} from '@tabler/icons-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { toast } from 'sonner';

// Composant pour afficher le logo du broker avec fallback
function BrokerLogoDisplay({
  broker
}: {
  broker: { name: string; logo_url?: string };
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        'relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl',
        'border border-white/5 bg-white/5',
        'transition-transform duration-300',
        'hover:scale-105'
      )}
    >
      {!imageError && broker.logo_url ? (
        <img
          src={broker.logo_url}
          alt={broker.name}
          className='[box-sizing:content-box] h-full w-full object-contain'
          onError={() => setImageError(true)}
        />
      ) : (
        <span className='text-xl font-bold'>
          {broker.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

const getStatusBadge = (status: string, errorMessage?: string) => {
  switch (status) {
    case 'active':
    case 'connected':
      return (
        <RendRBadge variant='success' dot dotColor='green'>
          Connecté
        </RendRBadge>
      );
    case 'pending':
    case 'pending_vps_setup':
      return (
        <RendRBadge variant='accent' dot dotColor='yellow'>
          Configuration en cours
        </RendRBadge>
      );
    case 'error':
      return (
        <RendRBadge variant='warning' dot dotColor='red'>
          Erreur
        </RendRBadge>
      );
    case 'inactive':
    case 'disconnected':
      return <RendRBadge variant='muted'>Déconnecté</RendRBadge>;
    default:
      return <RendRBadge variant='outline'>Inconnu</RendRBadge>;
  }
};

export function MyBrokers() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [tradesByAccount, setTradesByAccount] = useState<Record<string, any[]>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const supabase = createSupabaseClient();
  // Ref pour stocker les comptes et éviter les dépendances dans useEffect
  const accountsRef = useRef<any[]>([]);

  // Charger les comptes depuis le backend
  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Erreur de session:', sessionError);
        setIsLoading(false);
        return;
      }

      if (session?.access_token) {
        const data = await backendClient.getTradingAccounts(
          session.access_token
        );
        console.log('Comptes chargés:', data);
        setAccounts(data);
        // Mettre à jour la ref pour l'utiliser dans l'interval
        accountsRef.current = data;

        // Charger les trades pour chaque compte
        await loadTradesForAccounts(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
      toast.error('Erreur lors du chargement des comptes', {
        description:
          error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les trades pour tous les comptes
  const loadTradesForAccounts = async (accountsList: any[]) => {
    try {
      const tradesMap: Record<string, any[]> = {};

      for (const account of accountsList) {
        const { data: trades, error } = await supabase
          .from('trades')
          .select('*')
          .eq('trading_account_id', account.id)
          .order('close_time', { ascending: false });

        if (!error && trades) {
          tradesMap[account.id] = trades;
        }
      }

      setTradesByAccount(tradesMap);
    } catch (error) {
      console.error('Erreur lors du chargement des trades:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const loadingToast = toast.loading('Suppression du compte en cours...');

      const response = await fetch(`/api/trading-accounts?id=${accountId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      toast.dismiss(loadingToast);

      if (!response.ok) {
        toast.error(data.message || 'Erreur lors de la suppression du compte');
        return;
      }

      toast.success('Compte supprimé avec succès');
      setDeleteDialogOpen(false);
      setAccountToDelete(null);

      // Recharger les comptes
      loadAccounts();
    } catch (error) {
      toast.error('Erreur lors de la suppression du compte');
      console.error(error);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  useEffect(() => {
    loadAccounts();

    // Rafraîchir automatiquement toutes les 30 secondes pour les comptes en attente
    const interval = setInterval(() => {
      // Utiliser la ref au lieu de accounts pour éviter les dépendances
      const hasPendingAccounts = accountsRef.current.some(
        (acc) => acc.status === 'pending_vps_setup'
      );
      if (hasPendingAccounts) {
        loadAccounts();
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendances vides - ne s'exécute qu'une fois au montage

  // Transformer les comptes Supabase au format attendu avec stats calculées depuis les trades
  const transformedAccounts = useMemo(() => {
    return accounts.map((account) => {
      // Trouver le broker correspondant dans les données
      const brokerInfo =
        brokersData.find((b) => b.name === account.broker) ||
        userBrokersData.find((ub) => ub.broker.name === account.broker)?.broker;

      // Récupérer les trades pour ce compte
      const accountTrades = tradesByAccount[account.id] || [];

      // Calculer le volume total (somme des lots)
      const totalVolume = accountTrades.reduce((sum, trade) => {
        return sum + parseFloat(trade.lots || '0');
      }, 0);

      // Calculer le cashback total
      const totalCashback = accountTrades.reduce((sum, trade) => {
        const lots = parseFloat(trade.lots || '0');
        const commission = parseFloat(trade.commission || '0');
        const cashback = calculateCashbackForTrade(
          account.broker,
          lots,
          commission > 0 ? commission : undefined
        );
        return sum + cashback;
      }, 0);

      // Nombre de trades
      const tradeCount = accountTrades.length;

      return {
        id: account.id,
        account_id: account.external_account_id,
        broker: brokerInfo || {
          id: `broker-${account.broker}`,
          name: account.broker,
          logo_url:
            brokersData.find((b) => b.name === account.broker)?.logo_url || '',
          category: 'forex' as const,
          cashback_rate: 0.15, // Valeur par défaut
          min_withdrawal: 50,
          description: `Compte ${account.broker}`,
          website_url: '',
          supported_pairs: [],
          created_at: account.created_at
        },
        status: account.status || 'pending',
        error_message: account.error_message,
        total_cashback: totalCashback,
        total_volume: totalVolume,
        trade_count: tradeCount,
        linked_at: account.created_at,
        platform: account.platform,
        server: account.server,
        login: account.login,
        updated_at: account.updated_at
      };
    });
  }, [accounts, tradesByAccount]);

  // Calcul des stats globales depuis les données réelles
  const globalStats = useMemo(() => {
    const totalCashback = transformedAccounts.reduce(
      (acc, ub) => acc + ub.total_cashback,
      0
    );
    const totalVolume = transformedAccounts.reduce(
      (acc, ub) => acc + ub.total_volume,
      0
    );
    const activeBrokers = transformedAccounts.filter(
      (ub) => ub.status === 'active'
    ).length;
    // Calculer le total de trades depuis les comptes (utilise trade_count)
    const totalTrades = transformedAccounts.reduce(
      (acc, ub) => acc + (ub.trade_count || 0),
      0
    );

    return {
      totalCashback,
      totalVolume,
      activeBrokers,
      totalTrades,
      avgCashbackPerBroker:
        transformedAccounts.length > 0
          ? totalCashback / transformedAccounts.length
          : 0,
      avgVolumePerBroker:
        transformedAccounts.length > 0
          ? totalVolume / transformedAccounts.length
          : 0
    };
  }, [transformedAccounts]);

  // Stats par broker (utilise maintenant les données réelles)
  const brokerStats = useMemo(() => {
    return transformedAccounts.map((ub) => {
      // Utiliser les trades réels depuis Supabase
      const accountTrades = tradesByAccount[ub.id] || [];
      const recentTrades = accountTrades.slice(0, 3).map((trade: any) => ({
        id: trade.id,
        trade_id: trade.ticket,
        pair: trade.symbol,
        volume: parseFloat(trade.lots || '0'),
        profit: parseFloat(trade.profit || '0'), // Profit réel du trade
        cashback_amount: calculateCashbackForTrade(
          ub.broker.name,
          parseFloat(trade.lots || '0'),
          parseFloat(trade.commission || '0') > 0
            ? parseFloat(trade.commission || '0')
            : undefined
        ),
        status: 'confirmed' as const,
        trade_date: trade.close_time,
        created_at: trade.created_at
      }));

      const tradeCount = ub.trade_count || accountTrades.length;
      const avgCashbackPerTrade =
        tradeCount > 0 ? ub.total_cashback / tradeCount : 0;
      const avgVolumePerTrade =
        tradeCount > 0 ? ub.total_volume / tradeCount : 0;
      const cashbackPerLot =
        ub.total_volume > 0 ? ub.total_cashback / ub.total_volume : 0;

      const lastActivity =
        accountTrades.length > 0 ? accountTrades[0].close_time : ub.linked_at;

      return {
        ...ub,
        tradeCount,
        recentTrades,
        avgCashbackPerTrade,
        avgVolumePerTrade,
        cashbackPerLot,
        lastActivity
      };
    });
  }, [transformedAccounts, tradesByAccount]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>Chargement...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className='space-y-6'>
        <div
          className={cn(
            'rounded-2xl p-8 md:p-12',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationFillMode: 'forwards' }}
        >
          <div className='flex flex-col items-center justify-center'>
            <div className='animate-pulse-subtle mb-4 rounded-2xl border border-white/5 bg-white/5 p-4'>
              <IconChartBar className='text-muted-foreground h-8 w-8' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>
              Aucun broker connecté
            </h3>
            <p className='text-muted-foreground mb-4 max-w-md text-center'>
              Connectez votre premier compte de trading pour commencer à
              recevoir du cashback
            </p>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className='mr-2 h-4 w-4' />
                  Ajouter un compte
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Ajouter un compte de trading</DialogTitle>
                </DialogHeader>
                <CreateTradingAccountForm
                  onSuccess={() => {
                    setShowCreateForm(false);
                    loadAccounts(); // Recharger les comptes après création
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Globales */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {/* Total Cashback */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-[#c5d13f]/20',
            'transition-all duration-300',
            'hover:border-[#c5d13f]/40',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
              <IconCash className='h-5 w-5 text-[#c5d13f]' />
            </div>
            <span className='text-muted-foreground text-sm'>
              Cashback Total
            </span>
          </div>
          <p className='stat-number text-3xl font-bold text-[#c5d13f]'>
            +{globalStats.totalCashback.toFixed(2)}€
          </p>
          <p className='text-muted-foreground/60 mt-1 text-sm'>
            ~{globalStats.avgCashbackPerBroker.toFixed(2)}€ par compte
          </p>
        </div>

        {/* Volume Total */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconChartBar className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>Volume Total</span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {globalStats.totalVolume.toFixed(2)}
          </p>
          <p className='text-muted-foreground/60 mt-1 text-sm'>lots tradés</p>
        </div>

        {/* Comptes Actifs */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconWallet className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>Comptes</span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {globalStats.activeBrokers}
          </p>
          <div className='mt-1 flex items-center gap-2'>
            <RendRBadge variant='success' size='sm' dot dotColor='green'>
              {globalStats.activeBrokers} actifs
            </RendRBadge>
            {userBrokersData.length - globalStats.activeBrokers > 0 && (
              <RendRBadge variant='outline' size='sm'>
                {userBrokersData.length - globalStats.activeBrokers} autres
              </RendRBadge>
            )}
          </div>
        </div>

        {/* Total Trades */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconActivity className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>Trades</span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {globalStats.totalTrades}
          </p>
          <p className='text-muted-foreground/60 mt-1 text-sm'>tous comptes</p>
        </div>
      </div>

      {/* Liste des Comptes */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {brokerStats.map((broker, index) => (
          <div
            key={broker.id}
            className={cn(
              'relative overflow-hidden rounded-2xl p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border transition-all duration-300',
              broker.status === 'active'
                ? 'border-white/5 hover:border-white/10'
                : 'border-white/5',
              'hover:bg-zinc-900/50',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              'animate-fade-in-up opacity-0'
            )}
            style={{
              animationDelay: `${200 + index * 100}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {/* Header avec badge */}
            <div className='mb-6 flex items-start justify-between'>
              <div className='flex items-center gap-4'>
                <BrokerLogoDisplay broker={broker.broker} />
                <div>
                  <h3 className='mb-1 text-xl font-semibold'>
                    {broker.broker.name}
                  </h3>
                  <div className='flex items-center gap-2'>
                    <p className='text-muted-foreground font-mono text-xs'>
                      {broker.account_id}
                    </p>
                    <span className='text-muted-foreground/40'>•</span>
                    <p className='text-muted-foreground/60 text-xs'>
                      Connecté{' '}
                      {formatDistanceToNow(new Date(broker.linked_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                  </div>
                </div>
              </div>
              {getStatusBadge(broker.status)}
            </div>

            {/* Stats principales */}
            <div className='mb-6 grid grid-cols-2 gap-4'>
              <div
                className={cn(
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='mb-2 flex items-center gap-2'>
                  <IconCash className='h-4 w-4 text-[#c5d13f]' />
                  <span className='text-muted-foreground text-xs'>
                    Cashback Total
                  </span>
                </div>
                <p className='stat-number text-2xl font-bold text-[#c5d13f]'>
                  {broker.total_cashback.toFixed(2)}€
                </p>
                <p className='text-muted-foreground/60 mt-1 text-xs'>
                  {broker.cashbackPerLot > 0 &&
                    `~${broker.cashbackPerLot.toFixed(2)}€/lot`}
                </p>
              </div>

              <div
                className={cn(
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='mb-2 flex items-center gap-2'>
                  <IconChartBar className='h-4 w-4' />
                  <span className='text-muted-foreground text-xs'>
                    Volume Tradé
                  </span>
                </div>
                <p className='stat-number text-2xl font-bold'>
                  {broker.total_volume.toFixed(1)}
                </p>
                <p className='text-muted-foreground/60 mt-1 text-xs'>lots</p>
              </div>
            </div>

            {/* Métriques détaillées */}
            <div className='mb-6 grid grid-cols-3 gap-3'>
              <div className='text-center'>
                <p className='text-muted-foreground mb-1 text-xs'>Trades</p>
                <p className='stat-number text-lg font-bold'>
                  {broker.tradeCount}
                </p>
              </div>
              <div className='border-x border-white/5 text-center'>
                <p className='text-muted-foreground mb-1 text-xs'>
                  Moy. / Trade
                </p>
                <p className='stat-number text-lg font-bold text-[#c5d13f]'>
                  {broker.avgCashbackPerTrade > 0
                    ? `+${broker.avgCashbackPerTrade.toFixed(2)}€`
                    : '—'}
                </p>
              </div>
              <div className='text-center'>
                <p className='text-muted-foreground mb-1 text-xs'>Taux</p>
                <p className='text-lg font-bold text-[#c5d13f]'>
                  {(broker.broker.cashback_rate * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Dernière activité */}
            {broker.recentTrades.length > 0 && (
              <div className='mb-6'>
                <div className='mb-3 flex items-center gap-2'>
                  <IconActivity className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Dernière activité</span>
                </div>
                <div className='space-y-2'>
                  {broker.recentTrades.slice(0, 2).map((trade) => (
                    <div
                      key={trade.id}
                      className={cn(
                        'flex items-center justify-between',
                        'rounded-lg p-2',
                        'border border-white/5 bg-white/5',
                        'transition-all duration-200',
                        'hover:bg-white/10'
                      )}
                    >
                      <div className='flex items-center gap-2'>
                        <RendRBadge
                          variant='outline'
                          size='sm'
                          className='font-mono text-xs'
                        >
                          {trade.pair}
                        </RendRBadge>
                        <span className='text-muted-foreground text-xs'>
                          {format(new Date(trade.trade_date), 'dd MMM', {
                            locale: fr
                          })}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          trade.profit >= 0 ? 'text-green-400' : 'text-red-400'
                        )}
                      >
                        {trade.profit >= 0 ? '+' : ''}
                        {trade.profit.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message d'erreur si présent */}
            {broker.status === 'error' && broker.error_message && (
              <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3'>
                <p className='text-sm font-medium text-red-400'>
                  Erreur de connexion
                </p>
                <p className='mt-1 text-xs text-red-300/80'>
                  {broker.error_message}
                </p>
                <p className='mt-2 text-xs text-red-300/60'>
                  Le VPS va réessayer automatiquement. Si le problème persiste,
                  vérifiez vos identifiants.
                </p>
              </div>
            )}

            {/* Message d'attente si en cours de configuration */}
            {broker.status === 'pending_vps_setup' && (
              <div className='mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3'>
                <p className='text-sm font-medium text-yellow-400'>
                  Configuration en cours
                </p>
                <p className='mt-1 text-xs text-yellow-300/80'>
                  Le VPS est en train de configurer votre terminal MT4/MT5. Cela
                  peut prendre quelques minutes.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className='flex gap-2 border-t border-white/5 pt-4'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1'
                onClick={() => {
                  loadAccounts();
                  toast.info(`Actualisation de ${broker.broker.name}`, {
                    description:
                      'Les informations du compte ont été mises à jour.',
                    duration: 3000
                  });
                }}
              >
                <IconRefresh className='mr-2 h-4 w-4' />
                Actualiser
              </Button>
              <Button variant='ghost' size='sm' className='hover:bg-white/5'>
                <IconExternalLink className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='text-red-400 hover:bg-red-500/10 hover:text-red-300'
                onClick={() => {
                  setAccountToDelete(broker.id);
                  setDeleteDialogOpen(true);
                }}
              >
                <IconTrash className='h-4 w-4' />
              </Button>
            </div>
          </div>
        ))}

        {/* Card pour ajouter un nouveau broker */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <div
              className={cn(
                'h-full cursor-pointer rounded-2xl p-6',
                'bg-zinc-900/20 backdrop-blur-sm',
                'border border-dashed border-white/10',
                'transition-all duration-300',
                'hover:border-white/20 hover:bg-zinc-900/40',
                'hover:-translate-y-1',
                'animate-fade-in-up group opacity-0'
              )}
              style={{
                animationDelay: `${200 + brokerStats.length * 100}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <div className='flex h-full flex-col items-center justify-center py-12'>
                <div className='mb-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/10'>
                  <IconPlus className='text-muted-foreground group-hover:text-foreground h-8 w-8 transition-colors' />
                </div>
                <h3 className='group-hover:text-foreground mb-2 text-lg font-semibold transition-colors'>
                  Ajouter un compte
                </h3>
                <p className='text-muted-foreground mb-6 max-w-xs text-center text-sm transition-colors'>
                  Connectez un nouveau compte de trading MT4/MT5 pour commencer
                  à recevoir du cashback
                </p>
                <Button
                  variant='outline'
                  className='group-hover:border-white/20'
                >
                  <IconPlus className='mr-2 h-4 w-4' />
                  Ajouter un compte
                  <IconArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Ajouter un compte de trading</DialogTitle>
            </DialogHeader>
            <CreateTradingAccountForm
              onSuccess={() => {
                setShowCreateForm(false);
                loadAccounts(); // Recharger les comptes après création
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Dialogue de confirmation pour supprimer un compte */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Supprimer le compte de trading
              </AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce compte de trading ? Cette
                action est irréversible et toutes les données associées (trades,
                historique) seront également supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setAccountToDelete(null);
                }}
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (accountToDelete) {
                    handleDeleteAccount(accountToDelete);
                  }
                }}
                className='bg-red-500 hover:bg-red-600 focus:ring-red-500'
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
