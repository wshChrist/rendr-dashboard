'use client';

import { useState } from 'react';
import { userStatsData, withdrawalsData } from '@/constants/cashback-data';
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

export function WithdrawalsView() {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const stats = userStatsData;

  const pendingWithdrawals = withdrawalsData.filter(
    (w) => w.status === 'processing' || w.status === 'pending'
  );
  const completedWithdrawals = withdrawalsData.filter(
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
            {stats.available_balance.toFixed(2)}€
          </p>
          <Dialog>
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
                    {stats.available_balance.toFixed(2)}€
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
                    Minimum: 20€ | Maximum: {stats.available_balance.toFixed(2)}
                    €
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
              </div>
              <DialogFooter className='gap-2'>
                <Button
                  variant='outline'
                  className='border-white/10 bg-white/5 hover:bg-white/10'
                >
                  Annuler
                </Button>
                <Button className='bg-[#c5d13f] text-black hover:bg-[#c5d13f]/90'>
                  Confirmer le retrait
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
            {pendingWithdrawals
              .reduce((acc, w) => acc + w.amount, 0)
              .toFixed(2)}
            €
          </p>
          <p className='text-muted-foreground text-sm'>
            {pendingWithdrawals.length} retrait(s) en cours
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
            {stats.total_withdrawn.toFixed(2)}€
          </p>
          <p className='text-muted-foreground text-sm'>
            {completedWithdrawals.length} retrait(s) complété(s)
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

        <WithdrawalsTable data={withdrawalsData} />
      </div>
    </div>
  );
}
