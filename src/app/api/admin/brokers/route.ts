import { NextRequest, NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Broker } from '@/types/cashback';

type BrokerSettingRow = {
  broker_name: string;
  is_available: boolean;
  is_maintenance: boolean;
  maintenance_message: string | null;
};

/**
 * Liste des brokers + paramètres (disponible/maintenance).
 */
export async function GET() {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = createServiceRoleClient();

    // Charger les brokers depuis la base de données
    const { data: brokersData, error: brokersError } = await supabaseAdmin
      .from('brokers')
      .select('*')
      .order('name', { ascending: true });

    if (brokersError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: brokersError.message },
        { status: 500 }
      );
    }

    // Charger les settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('broker_settings')
      .select('broker_name,is_available,is_maintenance,maintenance_message');

    if (settingsError) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: settingsError.message },
        { status: 500 }
      );
    }

    const settingsByName = new Map<string, BrokerSettingRow>();
    for (const row of (settingsData ?? []) as BrokerSettingRow[]) {
      settingsByName.set(row.broker_name, row);
    }

    // Convertir les données de la DB en format Broker
    const brokers: Broker[] = (brokersData ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      logo_url: row.logo_url,
      category: row.category as Broker['category'],
      cashback_rate: Number(row.cashback_rate),
      min_withdrawal: Number(row.min_withdrawal),
      description: row.description || '',
      website_url: row.website_url,
      supported_pairs: row.supported_pairs || [],
      payout_per_lot_by_category: row.payout_per_lot_by_category || undefined,
      created_at: row.created_at
    }));

    const result = brokers.map((b) => {
      const s = settingsByName.get(b.name);
      return {
        broker: b,
        settings: {
          broker_name: b.name,
          is_available: s?.is_available ?? false,
          is_maintenance: s?.is_maintenance ?? false,
          maintenance_message: s?.maintenance_message ?? null
        }
      };
    });

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
 * Met à jour (upsert) les paramètres d'un broker.
 * Body: { broker_name: string, is_available?: boolean, is_maintenance?: boolean, maintenance_message?: string|null }
 */
export async function PATCH(request: NextRequest) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const broker_name = body?.broker_name as unknown;

    if (typeof broker_name !== 'string' || broker_name.trim() === '') {
      return NextResponse.json(
        { error: 'Requête invalide', message: 'broker_name manquant' },
        { status: 400 }
      );
    }

    const is_available =
      body?.is_available === undefined ? undefined : Boolean(body.is_available);
    const is_maintenance =
      body?.is_maintenance === undefined
        ? undefined
        : Boolean(body.is_maintenance);
    const maintenance_message =
      body?.maintenance_message === undefined
        ? undefined
        : body.maintenance_message === null
          ? null
          : String(body.maintenance_message);

    const supabaseAdmin = createServiceRoleClient();

    // Lire l'existant pour merge seulement si certaines valeurs ne sont pas fournies
    const { data: existing } = await supabaseAdmin
      .from('broker_settings')
      .select('broker_name,is_available,is_maintenance,maintenance_message')
      .eq('broker_name', broker_name.trim())
      .maybeSingle();

    const next: BrokerSettingRow = {
      broker_name: broker_name.trim(),
      // Utiliser la valeur fournie, sinon l'existante, sinon false par défaut (plus sûr)
      is_available:
        is_available !== undefined
          ? is_available
          : (existing?.is_available ?? false),
      is_maintenance:
        is_maintenance !== undefined
          ? is_maintenance
          : (existing?.is_maintenance ?? false),
      maintenance_message:
        maintenance_message !== undefined
          ? maintenance_message
          : (existing?.maintenance_message ?? null)
    };

    // Cohérence: si maintenance => indisponible
    if (next.is_maintenance) {
      next.is_available = false;
    }

    const { data, error } = await supabaseAdmin
      .from('broker_settings')
      .upsert(next, { onConflict: 'broker_name' })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
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
