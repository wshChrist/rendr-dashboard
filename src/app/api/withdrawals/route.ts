import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateCashbackForTrade } from '@/lib/utils/broker-cashback';

/**
 * Route API pour récupérer les retraits de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé', message: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    // Récupérer les retraits de l'utilisateur
    const { data: withdrawals, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });

    if (fetchError) {
      console.error('Erreur Supabase:', fetchError);
      return NextResponse.json(
        { error: 'Erreur de base de données', message: fetchError.message },
        { status: 500 }
      );
    }

    // Convertir les montants en nombres
    const formattedWithdrawals = withdrawals.map((w) => ({
      ...w,
      amount: parseFloat(w.amount.toString())
    }));

    return NextResponse.json(formattedWithdrawals, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des retraits:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}

/**
 * Route API pour créer un nouveau retrait
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé', message: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    // Lire le body de la requête
    const body = await request.json();
    const { amount, payment_method, payment_details } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          error: 'Montant invalide',
          message: 'Le montant doit être supérieur à 0'
        },
        { status: 400 }
      );
    }

    if (
      !payment_method ||
      !['bank_transfer', 'paypal', 'crypto'].includes(payment_method)
    ) {
      return NextResponse.json(
        {
          error: 'Méthode de paiement invalide',
          message: 'Méthode de paiement non supportée'
        },
        { status: 400 }
      );
    }

    if (!payment_details || payment_details.trim() === '') {
      return NextResponse.json(
        {
          error: 'Détails de paiement manquants',
          message: 'Les détails de paiement sont requis'
        },
        { status: 400 }
      );
    }

    // Vérifier le solde disponible
    // Calculer le total cashback depuis les trades
    const { data: accounts } = await supabase
      .from('trading_accounts')
      .select('id, broker')
      .eq('user_id', user.id);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucun compte',
          message: 'Vous devez avoir au moins un compte de trading'
        },
        { status: 400 }
      );
    }

    const accountIds = accounts.map((a) => a.id);
    const { data: trades } = await supabase
      .from('trades')
      .select('lots, commission, trading_account_id, symbol')
      .in('trading_account_id', accountIds);

    // Calculer le cashback total en utilisant la même logique que dans use-trading-data
    let totalCashback = 0;
    if (trades && accounts) {
      trades.forEach((trade) => {
        const account = accounts.find((a) => a.id === trade.trading_account_id);
        const brokerName =
          (account as { broker?: string })?.broker || 'Unknown';
        const lots = parseFloat(trade.lots || '0');
        const symbol = (trade as { symbol?: string })?.symbol || 'EURUSD';
        const cashback = calculateCashbackForTrade(brokerName, symbol, lots);
        totalCashback += cashback;
      });
    }

    // Calculer le total des retraits complétés
    const { data: completedWithdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const totalWithdrawn = completedWithdrawals
      ? completedWithdrawals.reduce(
          (sum, w) => sum + parseFloat(w.amount.toString()),
          0
        )
      : 0;

    const availableBalance = totalCashback - totalWithdrawn;

    if (amount > availableBalance) {
      return NextResponse.json(
        {
          error: 'Solde insuffisant',
          message: `Solde disponible: ${availableBalance.toFixed(2)}€`
        },
        { status: 400 }
      );
    }

    // Créer le retrait
    const { data: withdrawal, error: insertError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: amount,
        payment_method: payment_method,
        payment_details: payment_details,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur Supabase:', insertError);
      return NextResponse.json(
        { error: 'Erreur de base de données', message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ...withdrawal,
        amount: parseFloat(withdrawal.amount.toString())
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création du retrait:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
