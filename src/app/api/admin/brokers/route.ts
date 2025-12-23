import { NextRequest, NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { brokersData } from '@/constants/brokers';

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
    const { data, error } = await supabaseAdmin
      .from('broker_settings')
      .select('broker_name,is_available,is_maintenance,maintenance_message');

    if (error) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    const settingsByName = new Map<string, BrokerSettingRow>();
    for (const row of (data ?? []) as BrokerSettingRow[]) {
      settingsByName.set(row.broker_name, row);
    }

    const result = brokersData.map((b) => {
      const s = settingsByName.get(b.name);
      return {
        broker: b,
        settings: {
          broker_name: b.name,
          is_available: s?.is_available ?? true,
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

    // Lire l’existant pour merge
    const { data: existing } = await supabaseAdmin
      .from('broker_settings')
      .select('broker_name,is_available,is_maintenance,maintenance_message')
      .eq('broker_name', broker_name.trim())
      .maybeSingle();

    const next: BrokerSettingRow = {
      broker_name: broker_name.trim(),
      is_available: is_available ?? existing?.is_available ?? true,
      is_maintenance: is_maintenance ?? existing?.is_maintenance ?? false,
      maintenance_message:
        maintenance_message ?? existing?.maintenance_message ?? null
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

