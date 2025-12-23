import { NextRequest, NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

function isValidStatus(status: unknown): status is WithdrawalStatus {
  return (
    status === 'pending' ||
    status === 'processing' ||
    status === 'completed' ||
    status === 'rejected'
  );
}

/**
 * Liste administrateur des retraits (tous users).
 */
export async function GET() {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = createServiceRoleClient();

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select(
        `
        id,
        user_id,
        amount,
        status,
        payment_method,
        payment_details,
        requested_at,
        processed_at,
        transaction_ref,
        created_at,
        updated_at,
        user:users(email,name)
      `
      )
      .order('requested_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    const formatted = (data ?? []).map((w: any) => ({
      ...w,
      amount: parseFloat(w.amount?.toString?.() ?? String(w.amount ?? 0))
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error?.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}

/**
 * Met à jour un retrait (admin).
 * Body: { id: string, status: 'processing'|'completed'|'rejected'|'pending', transaction_ref?: string|null }
 */
export async function PATCH(request: NextRequest) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const id = body?.id as unknown;
    const status = body?.status as unknown;
    const transaction_ref = body?.transaction_ref as unknown;

    if (typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Requête invalide', message: 'id manquant' },
        { status: 400 }
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: 'Requête invalide', message: 'Statut invalide' },
        { status: 400 }
      );
    }

    if (status === 'completed') {
      if (
        transaction_ref !== undefined &&
        transaction_ref !== null &&
        typeof transaction_ref !== 'string'
      ) {
        return NextResponse.json(
          {
            error: 'Requête invalide',
            message: 'transaction_ref doit être une chaîne'
          },
          { status: 400 }
        );
      }
      if (typeof transaction_ref === 'string' && transaction_ref.trim() === '') {
        return NextResponse.json(
          {
            error: 'Requête invalide',
            message: 'Référence de transaction requise pour valider'
          },
          { status: 400 }
        );
      }
    }

    const supabaseAdmin = createServiceRoleClient();

    const updates: Record<string, any> = {
      status
    };

    if (status === 'completed' || status === 'rejected') {
      updates.processed_at = new Date().toISOString();
    } else if (status === 'pending') {
      // Revenir en pending => on retire le processed_at
      updates.processed_at = null;
    }

    if (transaction_ref !== undefined) {
      updates.transaction_ref = transaction_ref;
    }

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ...data,
        amount: parseFloat(data.amount?.toString?.() ?? String(data.amount ?? 0))
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error?.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}

