'use client';

import { useEffect, useState, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { RendRAsterisk } from '@/components/ui/rendr-decorations';
import { useTradingData } from '@/hooks/use-trading-data';
import type { User } from '@supabase/supabase-js';

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Bonjour';
  } else if (hour >= 12 && hour < 18) {
    return 'Bon après-midi';
  } else if (hour >= 18 && hour < 22) {
    return 'Bonsoir';
  } else {
    return 'Bonne nuit';
  }
}

function getMotivationalMessage(cashback: number): string {
  const messages = [
    'Prêt à faire croître votre cashback ?',
    'Vos trades travaillent pour vous.',
    'Continuez comme ça, vous êtes sur la bonne voie.',
    'Chaque trade compte.',
    "Votre cashback s'accumule."
  ];

  // Message basé sur le cashback
  if (cashback > 500) {
    return 'Excellente performance ce mois-ci.';
  } else if (cashback > 200) {
    return 'Vous êtes sur une belle lancée.';
  } else if (cashback > 0) {
    return 'Chaque trade vous rapproche de vos objectifs.';
  }

  // Message aléatoire sinon
  return messages[Math.floor(Math.random() * messages.length)];
}

export function WelcomeHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();
  const { transactions, isLoading: isLoadingTradingData } = useTradingData();

  // Calculer le cashback total depuis les transactions réelles
  const totalCashback = useMemo(
    () => transactions.reduce((acc, t) => acc + t.cashback_amount, 0),
    [transactions]
  );

  // Pour l'instant, pas de cashback en attente (pas de table withdrawals)
  const pendingCashback = 0;

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [supabase]);

  const greeting = getGreeting();
  const firstName =
    user?.user_metadata?.first_name ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Trader';
  const motivationalMessage = getMotivationalMessage(totalCashback);

  if (loading || isLoadingTradingData) {
    return (
      <div
        className='animate-fade-in-up space-y-2 opacity-0'
        style={{ animationFillMode: 'forwards' }}
      >
        <div className='bg-muted/50 h-10 w-64 animate-pulse rounded-xl' />
        <div className='bg-muted/30 h-5 w-80 animate-pulse rounded-lg' />
      </div>
    );
  }

  return (
    <div
      className='animate-fade-in-up relative space-y-2 opacity-0'
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Header avec style RendR */}
      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
        <RendRAsterisk size='sm' />
        <span>Dashboard</span>
        <div className='h-px w-8 bg-gradient-to-r from-white/30 to-transparent' />
      </div>

      <div className='flex flex-col gap-3 md:flex-row md:items-center md:gap-4'>
        <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
          {greeting}, <span className='text-foreground'>{firstName}</span>
        </h1>
        {stats.pending_cashback > 0 && (
          <RendRBadge
            variant='accent'
            size='lg'
            dot
            dotColor='green'
            className='animate-pulse-subtle w-fit'
          >
            +{stats.pending_cashback.toFixed(2)}€ en attente
          </RendRBadge>
        )}
      </div>

      <p className='text-muted-foreground max-w-xl text-base md:text-lg'>
        {motivationalMessage}
      </p>
    </div>
  );
}
