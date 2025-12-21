import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '@/lib/utils/encryption.util';

/**
 * Route API pour créer un compte de trading
 * Cette route crée directement dans Supabase si le backend NestJS n'est pas disponible
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
    const { broker, platform, server, login, investor_password } = body;

    // Validation
    if (!broker || !platform || !server || !login || !investor_password) {
      return NextResponse.json(
        { error: 'Données invalides', message: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (platform !== 'MT4' && platform !== 'MT5') {
      return NextResponse.json(
        {
          error: 'Plateforme invalide',
          message: 'La plateforme doit être MT4 ou MT5'
        },
        { status: 400 }
      );
    }

    // Générer un external_account_id unique
    const externalAccountId = uuidv4();

    // Chiffrer le mot de passe
    let encryptedPassword: string;
    try {
      encryptedPassword = encrypt(investor_password);
    } catch (error: any) {
      console.error('Erreur lors du chiffrement:', error);
      return NextResponse.json(
        {
          error: 'Erreur de chiffrement',
          message:
            'Impossible de chiffrer le mot de passe. Vérifiez la configuration ENCRYPTION_KEY.'
        },
        { status: 500 }
      );
    }

    // Insérer dans Supabase
    const { data: account, error: insertError } = await supabase
      .from('trading_accounts')
      .insert({
        user_id: user.id,
        broker,
        platform,
        server,
        login,
        investor_password: encryptedPassword,
        external_account_id: externalAccountId,
        status: 'pending_vps_setup'
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

    // Retourner la réponse au format attendu par le frontend
    return NextResponse.json(
      {
        id: account.id,
        external_account_id: account.external_account_id,
        user_id: account.user_id,
        broker: account.broker,
        platform: account.platform,
        server: account.server,
        status: account.status,
        created_at: account.created_at,
        updated_at: account.updated_at
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création du compte:', error);
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
 * Route API pour récupérer les comptes de trading de l'utilisateur
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

    // Récupérer les comptes de l'utilisateur
    const { data: accounts, error: fetchError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Erreur Supabase:', fetchError);
      return NextResponse.json(
        { error: 'Erreur de base de données', message: fetchError.message },
        { status: 500 }
      );
    }

    // Retourner les comptes (sans le mot de passe)
    const accountsWithoutPassword = accounts.map(
      ({ investor_password, ...account }) => account
    );

    return NextResponse.json(accountsWithoutPassword, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des comptes:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
