import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Route API pour recevoir les trades de l'EA
 * L'EA envoie les trades fermés avec signature HMAC
 */

// Headers CORS pour permettre les requêtes depuis MetaTrader
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      external_account_id,
      ticket,
      symbol,
      lots,
      commission,
      swap,
      profit,
      open_time,
      close_time,
      signature
    } = body;

    // Validation des champs requis
    if (
      !external_account_id ||
      !ticket ||
      !symbol ||
      lots === undefined ||
      profit === undefined ||
      !open_time ||
      !close_time
    ) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          message: 'Tous les champs requis sont manquants'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const supabase = await createClient();

    // Trouver le compte de trading
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('id, api_secret')
      .eq('external_account_id', external_account_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        {
          error: 'Compte non trouvé',
          message: `Aucun compte trouvé avec external_account_id=${external_account_id}`
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Vérifier la signature HMAC (si fournie)
    // Note: Pour l'instant, on accepte les trades sans vérification stricte
    // En production, implémenter la vérification HMAC complète
    if (signature) {
      // TODO: Implémenter la vérification HMAC
      // const expectedSignature = calculateHMAC(...);
      // if (signature !== expectedSignature) {
      //   return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
      // }
    }

    // Vérifier si le trade existe déjà
    const { data: existingTrade } = await supabase
      .from('trades')
      .select('id')
      .eq('trading_account_id', account.id)
      .eq('ticket', ticket.toString())
      .single();

    if (existingTrade) {
      // Trade déjà enregistré
      return NextResponse.json(
        { message: 'Trade déjà enregistré', trade_id: existingTrade.id },
        {
          status: 200,
          headers: corsHeaders
        }
      );
    }

    // Insérer le trade
    const { data: trade, error: insertError } = await supabase
      .from('trades')
      .insert({
        trading_account_id: account.id,
        ticket: ticket.toString(),
        symbol,
        lots: lots.toString(),
        commission: (commission || 0).toString(),
        swap: (swap || 0).toString(),
        profit: profit.toString(),
        open_time: new Date(open_time).toISOString(),
        close_time: new Date(close_time).toISOString(),
        raw_payload: body
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erreur lors de l'insertion du trade:", insertError);
      return NextResponse.json(
        { error: 'Erreur de base de données', message: insertError.message },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }

    return NextResponse.json(
      { message: 'Trade enregistré avec succès', trade_id: trade.id },
      {
        status: 201,
        headers: corsHeaders
      }
    );
  } catch (error: any) {
    console.error('Erreur lors de la réception du trade:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
