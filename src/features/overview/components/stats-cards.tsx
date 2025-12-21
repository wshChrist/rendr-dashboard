'use client';

import { RendRBadge } from '@/components/ui/rendr-badge';
import {
  IconTrendingUp,
  IconWallet,
  IconCash,
  IconChartBar,
  IconUsers,
  IconChevronRight
} from '@tabler/icons-react';
import {
  AnimatedNumber,
  AnimatedInteger
} from '@/components/ui/animated-number';
import { useTradingData } from '@/hooks/use-trading-data';
import { useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'accent' | 'success';
    dot?: boolean;
  };
  footer: {
    primary: React.ReactNode;
    secondary: string;
  };
  delay: number;
}

function StatCardItem({
  href,
  icon,
  label,
  value,
  badge,
  footer,
  delay
}: StatCardItemProps) {
  return (
    <Link href={href} className='group'>
      <div
        className={cn(
          'relative overflow-hidden',
          'rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'transition-all duration-300 ease-out',
          'hover:border-white/10 hover:bg-zinc-900/60',
          'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
          'cursor-pointer',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
      >
        {/* Header */}
        <div className='mb-4 flex items-start justify-between'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <span className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300 group-hover:border-white/10 group-hover:bg-white/10'>
              {icon}
            </span>
          </div>
          {badge && (
            <RendRBadge
              variant={badge.variant || 'default'}
              dot={badge.dot}
              dotColor='green'
              size='sm'
            >
              {badge.text}
            </RendRBadge>
          )}
        </div>

        {/* Label */}
        <p className='text-muted-foreground mb-1 text-sm'>{label}</p>

        {/* Value */}
        <div className='text-foreground stat-number mb-4 text-2xl font-bold md:text-3xl'>
          {value}
        </div>

        {/* Footer */}
        <div className='space-y-1.5 border-t border-white/5 pt-4'>
          <div className='text-foreground/90 text-sm font-medium'>
            {footer.primary}
          </div>
          <div className='text-muted-foreground group-hover:text-foreground/80 flex items-center gap-1.5 text-sm transition-colors'>
            {footer.secondary}
            <IconChevronRight className='h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1' />
          </div>
        </div>

        {/* Hover effect - gradient shine */}
        <div className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
          <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-1000 group-hover:translate-x-full' />
        </div>
      </div>
    </Link>
  );
}

export function StatsCards() {
  const { transactions, accounts, isLoading } = useTradingData();

  // Calculer les stats depuis les données réelles
  const stats = useMemo(() => {
    const totalCashback = transactions.reduce(
      (acc, t) => acc + t.cashback_amount,
      0
    );
    const totalVolume = transactions.reduce((acc, t) => acc + t.volume, 0);
    const totalTrades = transactions.length;
    const activeBrokers = accounts.filter(
      (a) => a.status === 'connected'
    ).length;

    // Pour l'instant, on utilise des valeurs par défaut pour les stats non disponibles
    // TODO: Calculer depuis les retraits réels quand cette fonctionnalité sera disponible
    const availableBalance = totalCashback * 0.8; // 80% disponible, 20% en attente
    const pendingCashback = totalCashback * 0.2;
    const totalWithdrawn = 0; // À calculer depuis la table withdrawals

    return {
      available_balance: availableBalance,
      pending_cashback: pendingCashback,
      total_cashback_earned: totalCashback,
      total_withdrawn: totalWithdrawn,
      total_volume: totalVolume,
      total_trades: totalTrades,
      active_brokers: activeBrokers
    };
  }, [transactions, accounts]);

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='h-40 animate-pulse rounded-2xl bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {/* Card 1 - Solde Disponible */}
      <StatCardItem
        href='/dashboard/withdrawals'
        icon={<IconWallet className='h-5 w-5' />}
        label='Solde Disponible'
        value={<AnimatedNumber value={stats.available_balance} suffix='€' />}
        badge={{ text: 'Retirable', variant: 'accent', dot: true }}
        footer={{
          primary:
            stats.pending_cashback > 0 ? (
              <span className='flex items-center gap-1'>
                +<AnimatedNumber value={stats.pending_cashback} suffix='€' /> en
                attente
              </span>
            ) : (
              'Aucun cashback en attente'
            ),
          secondary: 'Demander un retrait'
        }}
        delay={0}
      />

      {/* Card 2 - Cashback Total */}
      <StatCardItem
        href='/dashboard/transactions'
        icon={<IconCash className='h-5 w-5' />}
        label='Cashback Total'
        value={
          <AnimatedNumber value={stats.total_cashback_earned} suffix='€' />
        }
        badge={{
          text: '+12.5%',
          variant: 'success'
        }}
        footer={{
          primary: (
            <span className='flex items-center gap-2'>
              Performance en hausse
              <IconTrendingUp className='animate-pulse-subtle h-4 w-4 text-white/60' />
            </span>
          ),
          secondary: `Retiré: ${stats.total_withdrawn.toFixed(2)}€`
        }}
        delay={100}
      />

      {/* Card 3 - Volume Total */}
      <StatCardItem
        href='/dashboard/transactions'
        icon={<IconChartBar className='h-5 w-5' />}
        label='Volume Total'
        value={
          <AnimatedNumber
            value={stats.total_volume}
            decimals={1}
            suffix=' lots'
          />
        }
        badge={{ text: '+8.2%', variant: 'default' }}
        footer={{
          primary: (
            <span>
              <AnimatedInteger value={stats.total_trades} /> trades exécutés
            </span>
          ),
          secondary: 'Voir les transactions'
        }}
        delay={200}
      />

      {/* Card 4 - Brokers Actifs */}
      <StatCardItem
        href='/dashboard/brokers/my-brokers'
        icon={<IconUsers className='h-5 w-5' />}
        label='Brokers Actifs'
        value={<AnimatedInteger value={stats.active_brokers} />}
        badge={{ text: 'Connectés', dot: true }}
        footer={{
          primary: 'Comptes synchronisés',
          secondary: 'Gérer mes brokers'
        }}
        delay={300}
      />
    </div>
  );
}
