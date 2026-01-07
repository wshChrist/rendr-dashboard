import { NextRequest, NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Broker } from '@/types/cashback';

/**
 * Liste des brokers (admin uniquement)
 */
export async function GET() {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = createServiceRoleClient();
    const { data, error } = await supabaseAdmin
      .from('brokers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    // Convertir les données de la DB en format Broker
    const brokers: Broker[] = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      logo_url: row.logo_url,
      category: row.category as Broker['category'],
      cashback_rate: Number(row.cashback_rate),
      min_withdrawal: Number(row.min_withdrawal),
      description: row.description || '',
      website_url: row.website_url,
      supported_pairs: row.supported_pairs || [],
      created_at: row.created_at
    }));

    return NextResponse.json(brokers, { status: 200 });
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
 * Créer un nouveau broker
 * Body: { name, logo_url, category, cashback_rate, min_withdrawal, description, website_url, supported_pairs }
 */
export async function POST(request: NextRequest) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    // Validation
    if (
      !body.name ||
      typeof body.name !== 'string' ||
      body.name.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'Requête invalide', message: 'name est requis' },
        { status: 400 }
      );
    }

    if (!body.logo_url || typeof body.logo_url !== 'string') {
      return NextResponse.json(
        { error: 'Requête invalide', message: 'logo_url est requis' },
        { status: 400 }
      );
    }

    if (
      !body.category ||
      !['forex', 'crypto', 'futures', 'multi'].includes(body.category)
    ) {
      return NextResponse.json(
        {
          error: 'Requête invalide',
          message: 'category doit être forex, crypto, futures ou multi'
        },
        { status: 400 }
      );
    }

    if (
      typeof body.cashback_rate !== 'number' ||
      body.cashback_rate < 0 ||
      body.cashback_rate > 1
    ) {
      return NextResponse.json(
        {
          error: 'Requête invalide',
          message: 'cashback_rate doit être un nombre entre 0 et 1'
        },
        { status: 400 }
      );
    }

    if (typeof body.min_withdrawal !== 'number' || body.min_withdrawal < 0) {
      return NextResponse.json(
        {
          error: 'Requête invalide',
          message: 'min_withdrawal doit être un nombre positif'
        },
        { status: 400 }
      );
    }

    if (!body.website_url || typeof body.website_url !== 'string') {
      return NextResponse.json(
        { error: 'Requête invalide', message: 'website_url est requis' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();

    const { data, error } = await supabaseAdmin
      .from('brokers')
      .insert({
        name: body.name.trim(),
        logo_url: body.logo_url.trim(),
        category: body.category,
        cashback_rate: body.cashback_rate,
        min_withdrawal: body.min_withdrawal,
        description: body.description?.trim() || null,
        website_url: body.website_url.trim(),
        supported_pairs: Array.isArray(body.supported_pairs)
          ? body.supported_pairs
          : []
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        return NextResponse.json(
          {
            error: 'Erreur de base de données',
            message: 'Un broker avec ce nom existe déjà'
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    // Créer aussi une entrée dans broker_settings par défaut
    await supabaseAdmin.from('broker_settings').upsert(
      {
        broker_name: data.name,
        is_available: false, // Par défaut non disponible
        is_maintenance: false,
        maintenance_message: null
      },
      { onConflict: 'broker_name' }
    );

    return NextResponse.json(data, { status: 201 });
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
