'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { Withdrawal } from '@/types/cashback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconWallet,
  IconCreditCard,
  IconBrandPaypal,
  IconCurrencyBitcoin,
  IconArrowDown,
  IconClock,
  IconCheck,
  IconHistory,
  IconTrendingUp,
  IconChevronRight
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { WithdrawalsTable } from './withdrawals-table';
import { toast } from 'sonner';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { RendRBadge } from '@/components/ui/rendr-badge';
import Link from 'next/link';

export function WithdrawalsView() {
  const t = useTranslations();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState({
    available_balance: 0,
    total_withdrawn: 0,
    pending_withdrawals_count: 0,
    pending_withdrawals_amount: 0,
    completed_withdrawals_count: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = createSupabaseClient();

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Charger les retraits
      const withdrawalsResponse = await fetch('/api/withdrawals');
      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawals(withdrawalsData);
      }

      // Charger les stats
      const statsResponse = await fetch('/api/withdrawals/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          available_balance: statsData.available_balance || 0,
          total_withdrawn: statsData.total_withdrawn || 0,
          pending_withdrawals_count: statsData.pending_withdrawals_count || 0,
          pending_withdrawals_amount: statsData.pending_withdrawals_amount || 0,
          completed_withdrawals_count:
            statsData.completed_withdrawals_count || 0
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error(t('common.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || !paymentMethod || !paymentDetails) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < 20 || amountNum > stats.available_balance) {
      toast.error(
        t('withdrawals.amountRange', {
          max: stats.available_balance.toFixed(2)
        })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountNum,
          payment_method: paymentMethod,
          payment_details: paymentDetails
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || t('withdrawals.errors.createError'));
        return;
      }

      toast.success(t('withdrawals.success.createSuccess'));
      setAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
      setDialogOpen(false);

      // Recharger les données
      await loadData();
    } catch (error) {
      toast.error(t('withdrawals.errors.createError'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingWithdrawals = useMemo(
    () =>
      withdrawals.filter(
        (w) => w.status === 'processing' || w.status === 'pending'
      ),
    [withdrawals]
  );

  return (
    <div className='space-y-6'>
      {/* Stats Cards - Style Overview */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {/* Solde disponible */}
        <Link href='#withdraw' className='group'>
          <div
            className={cn(
              'relative overflow-hidden',
              'rounded-2xl p-5 md:p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-[#c5d13f]/20',
              'transition-all duration-300 ease-out',
              'hover:border-[#c5d13f]/40 hover:bg-zinc-900/60',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              'cursor-pointer',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationFillMode: 'forwards' }}
          >
            <div className='mb-4 flex items-start justify-between'>
              <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2 transition-all duration-300 group-hover:border-[#c5d13f]/40 group-hover:bg-[#c5d13f]/20'>
                <IconWallet className='h-5 w-5 text-[#c5d13f]' />
              </div>
              <RendRBadge variant='accent' dot dotColor='green' size='sm'>
                {t('withdrawals.withdrawable')}
              </RendRBadge>
            </div>
            <p className='text-muted-foreground mb-1 text-sm'>
              {t('withdrawals.availableBalance')}
            </p>
            <div className='text-foreground stat-number mb-4 text-2xl font-bold text-[#c5d13f] md:text-3xl'>
              {isLoading ? (
                <Skeleton className='h-8 w-24' />
              ) : (
                <AnimatedNumber value={stats.available_balance} suffix='€' />
              )}
            </div>
            <div className='space-y-1.5 border-t border-white/5 pt-4'>
              <div className='text-foreground/90 text-sm font-medium'>
                {t('withdrawals.requestWithdrawal')}
              </div>
              <div className='text-muted-foreground group-hover:text-foreground/80 flex items-center gap-1.5 text-sm transition-colors'>
                {t('withdrawals.clickToWithdraw')}
                <IconChevronRight className='h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1' />
              </div>
            </div>
          </div>
        </Link>

        {/* En attente */}
        <div
          className={cn(
            'relative overflow-hidden',
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300 ease-out',
            'hover:border-white/10 hover:bg-zinc-900/60',
            'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-4 flex items-start justify-between'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300'>
              <IconClock className='h-5 w-5' />
            </div>
            <RendRBadge variant='outline' size='sm'>
              {t('withdrawals.pending')}
            </RendRBadge>
          </div>
          <p className='text-muted-foreground mb-1 text-sm'>
            {t('withdrawals.pending')}
          </p>
          <div className='text-foreground stat-number mb-4 text-2xl font-bold md:text-3xl'>
            {isLoading ? (
              <Skeleton className='h-8 w-24' />
            ) : (
              <AnimatedNumber
                value={stats.pending_withdrawals_amount}
                suffix='€'
              />
            )}
          </div>
          <div className='space-y-1.5 border-t border-white/5 pt-4'>
            <div className='text-foreground/90 text-sm font-medium'>
              {isLoading ? '...' : stats.pending_withdrawals_count}{' '}
              {t('withdrawals.withdrawalsInProgress')}
            </div>
            <div className='text-muted-foreground text-sm'>
              {t('withdrawals.processingTime')}
            </div>
          </div>
        </div>

        {/* Total retiré */}
        <div
          className={cn(
            'relative overflow-hidden',
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300 ease-out',
            'hover:border-white/10 hover:bg-zinc-900/60',
            'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-4 flex items-start justify-between'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300'>
              <IconCheck className='h-5 w-5' />
            </div>
            <RendRBadge variant='default' size='sm'>
              <IconTrendingUp className='h-3 w-3' />
              {t('withdrawals.success')}
            </RendRBadge>
          </div>
          <p className='text-muted-foreground mb-1 text-sm'>
            {t('withdrawals.totalWithdrawn')}
          </p>
          <div className='text-foreground stat-number mb-4 text-2xl font-bold md:text-3xl'>
            {isLoading ? (
              <Skeleton className='h-8 w-24' />
            ) : (
              <AnimatedNumber value={stats.total_withdrawn} suffix='€' />
            )}
          </div>
          <div className='space-y-1.5 border-t border-white/5 pt-4'>
            <div className='text-foreground/90 text-sm font-medium'>
              {isLoading ? '...' : stats.completed_withdrawals_count}{' '}
              {t('withdrawals.completed')}
            </div>
            <div className='text-muted-foreground text-sm'>
              {t('withdrawals.allTime')}
            </div>
          </div>
        </div>
      </div>

      {/* Layout en deux colonnes */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Formulaire de retrait */}
        <Card
          id='withdraw'
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
                <IconArrowDown className='h-5 w-5 text-[#c5d13f]' />
              </div>
              <div>
                <CardTitle>{t('withdrawals.requestWithdrawal')}</CardTitle>
                <CardDescription>
                  {t('withdrawals.availableBalance')}:{' '}
                  <span className='font-semibold text-[#c5d13f]'>
                    {isLoading ? '...' : stats.available_balance.toFixed(2)}€
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='amount' className='text-sm font-medium'>
                {t('withdrawals.amount')}
              </Label>
              <Input
                id='amount'
                type='number'
                placeholder={t('pages.withdrawals.form.amountPlaceholder')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className='border-white/10 bg-white/5 focus:border-white/20'
                min={20}
                max={stats.available_balance}
              />
              <p className='text-muted-foreground text-xs'>
                {t('withdrawals.minimum')}: 20€ | {t('withdrawals.maximum')}:{' '}
                {isLoading ? '...' : stats.available_balance.toFixed(2)}€
              </p>
            </div>

            <Separator />

            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                {t('withdrawals.paymentMethod')}
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className='border-white/10 bg-white/5'>
                  <SelectValue placeholder={t('withdrawals.chooseMethod')} />
                </SelectTrigger>
                <SelectContent className='border-white/10 bg-zinc-900'>
                  <SelectItem
                    value='bank_transfer'
                    className='focus:bg-white/10'
                  >
                    <div className='flex items-center gap-2'>
                      <IconCreditCard className='h-4 w-4' />
                      {t('withdrawals.bankTransfer')}
                    </div>
                  </SelectItem>
                  <SelectItem value='paypal' className='focus:bg-white/10'>
                    <div className='flex items-center gap-2'>
                      <IconBrandPaypal className='h-4 w-4' />
                      {t('withdrawals.paypal')}
                    </div>
                  </SelectItem>
                  <SelectItem value='crypto' className='focus:bg-white/10'>
                    <div className='flex items-center gap-2'>
                      <IconCurrencyBitcoin className='h-4 w-4' />
                      {t('withdrawals.crypto')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod && (
              <>
                <Separator />
                <div className='space-y-2'>
                  <Label
                    htmlFor='payment-details'
                    className='text-sm font-medium'
                  >
                    {paymentMethod === 'bank_transfer'
                      ? t('withdrawals.iban')
                      : paymentMethod === 'paypal'
                        ? t('withdrawals.paypalEmail')
                        : t('withdrawals.cryptoAddress')}
                  </Label>
                  <Input
                    id='payment-details'
                    type='text'
                    placeholder={
                      paymentMethod === 'bank_transfer'
                        ? t('withdrawals.ibanPlaceholder')
                        : paymentMethod === 'paypal'
                          ? t('withdrawals.paypalEmailPlaceholder')
                          : t('withdrawals.cryptoAddressPlaceholder')
                    }
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    className='border-white/10 bg-white/5 focus:border-white/20'
                  />
                </div>
              </>
            )}

            <Separator />

            <Button
              className='w-full bg-[#c5d13f] text-black hover:bg-[#c5d13f]/90'
              onClick={handleWithdrawal}
              disabled={
                isSubmitting || !amount || !paymentMethod || !paymentDetails
              }
            >
              {isSubmitting
                ? t('common.processing')
                : t('withdrawals.confirmWithdrawal')}
            </Button>
          </CardContent>
        </Card>

        {/* Historique récent */}
        <Card
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                  <IconHistory className='h-5 w-5' />
                </div>
                <div>
                  <CardTitle>{t('withdrawals.recentActivity')}</CardTitle>
                  <CardDescription>
                    {t('withdrawals.lastWithdrawals')}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='space-y-4'>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className='h-16 w-full' />
                ))}
              </div>
            ) : pendingWithdrawals.length > 0 ? (
              <div className='space-y-3'>
                {pendingWithdrawals.slice(0, 3).map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className='rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='rounded-lg border border-orange-500/20 bg-orange-500/10 p-2'>
                          <IconClock className='h-4 w-4 text-orange-500' />
                        </div>
                        <div>
                          <p className='font-medium'>
                            {parseFloat(withdrawal.amount.toString()).toFixed(
                              2
                            )}
                            €
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {new Date(
                              withdrawal.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <RendRBadge variant='outline' size='sm'>
                        {t('withdrawals.pending')}
                      </RendRBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8'>
                <div className='mb-3 rounded-xl border border-white/5 bg-white/5 p-3'>
                  <IconHistory className='text-muted-foreground h-6 w-6' />
                </div>
                <p className='text-muted-foreground text-sm'>
                  {t('withdrawals.noRecentActivity')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique complet */}
      <Card
        className={cn(
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
      >
        <CardHeader>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconHistory className='h-5 w-5' />
            </div>
            <div>
              <CardTitle>{t('withdrawals.history')}</CardTitle>
              <CardDescription>
                {t('withdrawals.manageWithdrawals')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-4'>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className='h-20 w-full' />
              ))}
            </div>
          ) : (
            <WithdrawalsTable data={withdrawals} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
