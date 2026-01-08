import { NextRequest, NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { userId } = await params;
    const body = await request.json();
    const { period, cashback_amount } = body;

    if (!period || cashback_amount === undefined) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          message: 'La période et le montant sont requis'
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable', message: userError?.message },
        { status: 404 }
      );
    }

    // Mettre à jour ou créer la balance de cashback
    const { data: balance, error: balanceError } = await supabaseAdmin
      .from('cashback_balances')
      .upsert(
        {
          user_id: userId,
          period,
          cashback_amount: parseFloat(cashback_amount.toString()),
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,period',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (balanceError) {
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: balanceError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        balance: {
          ...balance,
          cashback_amount: Number(balance.cashback_amount)
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la balance:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
