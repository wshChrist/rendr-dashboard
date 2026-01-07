import { NextRequest, NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Récupère tous les comptes de trading en attente d'approbation
 */
export async function GET(request: NextRequest) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_approval';

    const supabaseAdmin = createServiceRoleClient();

    // Récupérer les comptes
    let query = supabaseAdmin
      .from('trading_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrer par statut si spécifié
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: accounts, error: accountsError } = await query;

    if (accountsError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: accountsError.message },
        { status: 500 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Récupérer les informations utilisateur pour chaque compte
    const userIds = [...new Set(accounts.map((acc: any) => acc.user_id))];
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .in('id', userIds);

    if (usersError) {
      // Si erreur sur les users, retourner quand même les comptes sans les infos user
      return NextResponse.json(
        accounts.map((acc: any) => ({
          ...acc,
          users: null
        })),
        { status: 200 }
      );
    }

    // Combiner les données
    const usersMap = new Map((users || []).map((u: any) => [u.id, u]));
    const result = accounts.map((acc: any) => ({
      ...acc,
      users: usersMap.get(acc.user_id) || null
    }));

    return NextResponse.json(result, { status: 200 });
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
 * Approuve ou rejette un compte de trading
 * Body: { account_id: string, action: 'approve' | 'reject', reason?: string }
 */
export async function PATCH(request: NextRequest) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const accountId = body?.account_id;
    const action = body?.action; // 'approve' ou 'reject'
    const reason = body?.reason;

    if (!accountId || typeof accountId !== 'string') {
      return NextResponse.json(
        { error: 'Requête invalide', message: 'account_id manquant' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Requête invalide',
          message: 'action doit être "approve" ou "reject"'
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();

    // Vérifier que le compte existe et est en attente d'approbation
    const { data: account, error: fetchError } = await supabaseAdmin
      .from('trading_accounts')
      .select('id, status')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      return NextResponse.json(
        {
          error: 'Compte introuvable',
          message: "Le compte spécifié n'existe pas"
        },
        { status: 404 }
      );
    }

    if (account.status !== 'pending_approval') {
      return NextResponse.json(
        {
          error: 'Action impossible',
          message: "Ce compte n'est pas en attente d'approbation"
        },
        { status: 400 }
      );
    }

    // Mettre à jour le statut
    const newStatus = action === 'approve' ? 'pending_vps_setup' : 'error';
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (action === 'reject' && reason) {
      updateData.error_message = reason;
    } else if (action === 'approve') {
      updateData.error_message = null;
    }

    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('trading_accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        account: updatedAccount,
        message:
          action === 'approve' ? 'Compte approuvé avec succès' : 'Compte rejeté'
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
