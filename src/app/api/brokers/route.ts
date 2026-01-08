import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Broker } from '@/types/cashback';

/**
 * Liste publique des brokers (lecture seule)
 */
export async function GET() {
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
      payout_per_lot_by_category: row.payout_per_lot_by_category || undefined,
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
