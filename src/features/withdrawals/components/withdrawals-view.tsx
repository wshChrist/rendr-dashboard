'use client';

import { useState, useEffect } from 'react';
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
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  IconWallet,
  IconCreditCard,
  IconBrandPaypal,
  IconCurrencyBitcoin,
  IconArrowDown,
  IconClock,
  IconCheck,
  IconHistory
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { WithdrawalsTable } from './withdrawals-table';
import { toast } from 'sonner';

export function WithdrawalsView() {
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
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || !paymentMethod || !paymentDetails) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < 20 || amountNum > stats.available_balance) {
      toast.error(
        `Le montant doit être entre 20€ et ${stats.available_balance.toFixed(2)}€`
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
        toast.error(data.message || 'Erreur lors de la création du retrait');
        return;
      }

      toast.success('Demande de retrait créée avec succès');
      setAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
      setDialogOpen(false);

      // Recharger les données
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la création du retrait');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingWithdrawals = withdrawals.filter(
    (w) => w.status === 'processing' || w.status === 'pending'
  );
  const completedWithdrawals = withdrawals.filter(
    (w) => w.status === 'completed'
  );

  return (
    <div className='space-y-6'>
      {/* Balance Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        {/* Solde disponible - Card principale */}
        <div
          className={cn(
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-[#c5d13f]/20',
            'transition-all duration-300',
            'hover:border-[#c5d13f]/40',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationFillMode: 'forwards' }}
        >
          <div className='mb-2 flex items-center gap-2'>
            <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconWallet className='h-4 w-4' />
            </span>
            <span className='text-muted-foreground text-sm'>
              Solde Disponible
            </span>
          </div>
          <p className='text-foreground stat-number mb-4 text-3xl font-bold'>
            {isLoading ? '...' : stats.available_balance.toFixed(2)}€
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className='w-full'>
                <IconArrowDown className='mr-2 h-4 w-4' />
                Demander un retrait
              </Button>
            </DialogTrigger>
            <DialogContent className='border-white/10 bg-zinc-900/95 backdrop-blur-sm'>
              <DialogHeader>
                <DialogTitle className='text-xl'>
                  Demander un retrait
                </DialogTitle>
                <DialogDescription className='text-muted-foreground'>
                  Solde disponible:{' '}
                  <span className='font-semibold text-[#c5d13f]'>
                    {isLoading ? '...' : stats.available_balance.toFixed(2)}€
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-5 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='amount' className='text-sm font-medium'>
                    Montant (€)
                  </Label>
                  <Input
                    id='amount'
                    type='number'
                    placeholder='50.00'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className='border-white/10 bg-white/5 focus:border-white/20'
                  />
                  <p className='text-muted-foreground text-xs'>
                    Minimum: 20€ | Maximum:{' '}
                    {isLoading ? '...' : stats.available_balance.toFixed(2)}€
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    Méthode de paiement
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className='border-white/10 bg-white/5'>
                      <SelectValue placeholder='Choisir une méthode' />
                    </SelectTrigger>
                    <SelectContent className='border-white/10 bg-zinc-900'>
                      <SelectItem
                        value='bank_transfer'
                        className='focus:bg-white/10'
                      >
                        <div className='flex items-center gap-2'>
                          <IconCreditCard className='h-4 w-4' />
                          Virement bancaire
                        </div>
                      </SelectItem>
                      <SelectItem value='paypal' className='focus:bg-white/10'>
                        <div className='flex items-center gap-2'>
                          <IconBrandPaypal className='h-4 w-4' />
                          PayPal
                        </div>
                      </SelectItem>
                      <SelectItem value='crypto' className='focus:bg-white/10'>
                        <div className='flex items-center gap-2'>
                          <IconCurrencyBitcoin className='h-4 w-4' />
                          Crypto (USDT)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentMethod && (
                  <div className='space-y-2'>
                    <Label
                      htmlFor='payment-details'
                      className='text-sm font-medium'
                    >
                      {paymentMethod === 'bank_transfer'
                        ? 'IBAN'
                        : paymentMethod === 'paypal'
                          ? 'Email PayPal'
                          : 'Adresse crypto (USDT)'}
                    </Label>
                    <Input
                      id='payment-details'
                      type='text'
                      placeholder={
                        paymentMethod === 'bank_transfer'
                          ? 'FR76 1234 5678 9012 3456 7890 123'
                          : paymentMethod === 'paypal'
                            ? 'votre@email.com'
                            : '0x...'
                      }
                      value={paymentDetails}
                      onChange={(e) => setPaymentDetails(e.target.value)}
                      className='border-white/10 bg-white/5 focus:border-white/20'
                    />
                  </div>
                )}
              </div>
              <DialogFooter className='gap-2'>
                <Button
                  variant='outline'
                  className='border-white/10 bg-white/5 hover:bg-white/10'
                  onClick={() => {
                    setAmount('');
                    setPaymentMethod('');
                    setPaymentDetails('');
                    setDialogOpen(false);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className='bg-[#c5d13f] text-black hover:bg-[#c5d13f]/90'
                  onClick={handleWithdrawal}
                  disabled={
                    isSubmitting || !amount || !paymentMethod || !paymentDetails
                  }
                >
                  {isSubmitting ? 'Traitement...' : 'Confirmer le retrait'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* En attente */}
        <div
          className={cn(
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-2 flex items-center gap-2'>
            <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconClock className='h-4 w-4' />
            </span>
            <span className='text-muted-foreground text-sm'>En attente</span>
          </div>
          <p className='text-muted-foreground mb-2 text-2xl font-bold'>
            {isLoading ? '...' : stats.pending_withdrawals_amount.toFixed(2)}€
          </p>
          <p className='text-muted-foreground text-sm'>
            {isLoading ? '...' : stats.pending_withdrawals_count} retrait(s) en
            cours
          </p>
        </div>

        {/* Total retiré */}
        <div
          className={cn(
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-2 flex items-center gap-2'>
            <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconCheck className='h-4 w-4' />
            </span>
            <span className='text-muted-foreground text-sm'>Total retiré</span>
          </div>
          <p className='text-foreground stat-number mb-2 text-2xl font-bold'>
            {isLoading ? '...' : stats.total_withdrawn.toFixed(2)}€
          </p>
          <p className='text-muted-foreground text-sm'>
            {isLoading ? '...' : stats.completed_withdrawals_count} retrait(s)
            complété(s)
          </p>
        </div>
      </div>

      {/* Withdrawals History */}
      <div
        className={cn(
          'rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
      >
        <div className='mb-6 flex items-center gap-2'>
          <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
            <IconHistory className='h-4 w-4' />
          </span>
          <div>
            <h3 className='text-lg font-semibold'>Historique des retraits</h3>
            <p className='text-muted-foreground text-sm'>
              Gérez et suivez tous vos retraits en un seul endroit
            </p>
          </div>
        </div>

        <WithdrawalsTable data={withdrawals} />
      </div>
    </div>
  );
}
