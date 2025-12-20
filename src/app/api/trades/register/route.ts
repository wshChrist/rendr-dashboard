import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Route API pour l'enregistrement automatique de l'EA
 * L'EA envoie account_number, server, platform et reçoit external_account_id et api_secret
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
    console.log('═══════════════════════════════════════════════════════════');
    console.log("=== REQUÊTE D'ENREGISTREMENT EA REÇUE ===");
    console.log('Timestamp:', new Date().toISOString());
    console.log('URL:', request.url);
    console.log('Method:', request.method);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));

    // Lire le body comme texte d'abord pour debug
    const bodyText = await request.text();
    console.log('Body brut (texte):', bodyText);
    console.log('Body brut (longueur):', bodyText.length);
    console.log('═══════════════════════════════════════════════════════════');

    let body;
    try {
      body = JSON.parse(bodyText);
      console.log('Body parsé:', body);
    } catch (parseError: any) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error("Body qui a causé l'erreur:", bodyText);
      return NextResponse.json(
        {
          error: 'JSON invalide',
          message: `Erreur de parsing: ${parseError.message}. Body reçu: ${bodyText.substring(0, 100)}`
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const { account_number, server, platform } = body;

    // Validation
    if (!account_number || !server || !platform) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          message: 'account_number, server et platform sont requis'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    if (platform !== 'MT4' && platform !== 'MT5') {
      return NextResponse.json(
        {
          error: 'Plateforme invalide',
          message: 'La plateforme doit être MT4 ou MT5'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const supabase = await createClient();

    // Normaliser les valeurs pour la recherche
    const normalizedLogin = account_number.toString().trim();
    const normalizedServer = server.trim();
    const normalizedPlatform = platform.trim().toUpperCase();

    console.log('Recherche du compte avec:', {
      login: normalizedLogin,
      server: normalizedServer,
      platform: normalizedPlatform
    });

    // Chercher le compte de trading correspondant
    // D'abord, récupérer tous les comptes pour debug si nécessaire
    const { data: allAccounts } = await supabase
      .from('trading_accounts')
      .select('login, server, platform')
      .limit(100);

    console.log('Comptes existants dans la DB:', allAccounts);

    const { data: account, error: fetchError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('login', normalizedLogin)
      .eq('server', normalizedServer)
      .eq('platform', normalizedPlatform)
      .single();

    if (fetchError || !account) {
      console.error('Compte non trouvé:', {
        recherché: {
          login: normalizedLogin,
          server: normalizedServer,
          platform: normalizedPlatform
        },
        erreur: fetchError,
        comptes_disponibles: allAccounts
      });
      return NextResponse.json(
        {
          error: 'Compte non trouvé',
          message: `Aucun compte trouvé avec login=${normalizedLogin}, server=${normalizedServer}, platform=${normalizedPlatform}. Veuillez créer le compte via le dashboard d'abord.`
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Générer un api_secret (basé sur external_account_id pour la cohérence)
    // En production, cela devrait être stocké de manière sécurisée
    // Pour l'instant, on génère un secret basé sur l'ID du compte
    const apiSecret = crypto
      .createHash('sha256')
      .update(`${account.external_account_id}-${account.id}-rendr-secret`)
      .digest('hex');

    // Retourner external_account_id et api_secret
    return NextResponse.json(
      {
        external_account_id: account.external_account_id,
        api_secret: apiSecret
      },
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'enregistrement de l'EA:", error);
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
