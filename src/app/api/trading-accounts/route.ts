import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
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

    // Log de débogage pour voir ce qui est reçu
    console.log('[DEBUG] Données reçues dans API route:');
    console.log('  - broker:', broker);
    console.log('  - platform:', platform);
    console.log('  - server:', server);
    console.log('  - login:', login);
    console.log(
      '  - investor_password (longueur):',
      investor_password?.length || 0
    );
    console.log(
      '  - investor_password (premiers 10):',
      investor_password?.substring(0, 10) || 'vide'
    );

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

    // Vérifier si le compte (login) est déjà associé à un autre utilisateur
    // Utiliser le service role client pour bypasser RLS et voir tous les comptes
    console.log('[DEBUG] Vérification du compte login:', login);
    console.log('[DEBUG] User ID actuel:', user.id);

    const supabaseAdmin = createServiceRoleClient();
    const { data: existingAccounts, error: checkError } = await supabaseAdmin
      .from('trading_accounts')
      .select('id, user_id')
      .eq('login', login)
      .limit(1);

    if (checkError) {
      console.error('Erreur lors de la vérification du compte:', checkError);
      return NextResponse.json(
        {
          error: 'Erreur de vérification',
          message: 'Erreur lors de la vérification du compte'
        },
        { status: 500 }
      );
    }

    console.log('[DEBUG] Comptes existants trouvés:', existingAccounts);

    // Si le compte existe et appartient à un autre utilisateur
    if (existingAccounts && existingAccounts.length > 0) {
      const existingAccount = existingAccounts[0];
      console.log(
        '[DEBUG] Compte existant - User ID:',
        existingAccount.user_id
      );
      console.log(
        '[DEBUG] Comparaison:',
        existingAccount.user_id.toString(),
        '!==',
        user.id.toString()
      );

      // Comparer les user_id en tant que strings pour éviter les problèmes de type UUID
      if (existingAccount.user_id.toString() !== user.id.toString()) {
        console.log('[DEBUG] Compte déjà associé à un autre utilisateur');
        return NextResponse.json(
          {
            error: 'Compte déjà associé',
            message:
              'Ce compte de trading est déjà associé à un autre utilisateur'
          },
          { status: 409 }
        );
      }
      // Si le compte appartient déjà à l'utilisateur actuel, on pourrait retourner une erreur
      // ou permettre la mise à jour. Pour l'instant, on retourne une erreur.
      console.log('[DEBUG] Compte déjà ajouté par cet utilisateur');
      return NextResponse.json(
        {
          error: 'Compte déjà ajouté',
          message: 'Ce compte de trading est déjà dans votre liste'
        },
        { status: 409 }
      );
    }

    console.log('[DEBUG] Aucun compte existant trouvé, création autorisée');

    // Générer un external_account_id unique
    const externalAccountId = uuidv4();

    // Chiffrer le mot de passe
    let encryptedPassword: string;
    try {
      console.log('[DEBUG] Avant chiffrement:');
      console.log('  - investor_password à chiffrer:', investor_password);
      encryptedPassword = encrypt(investor_password);
      console.log(
        '  - encryptedPassword (longueur):',
        encryptedPassword.length
      );
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
    console.log('[DEBUG] Données à insérer dans Supabase:');
    console.log('  - broker:', broker);
    console.log('  - platform:', platform);
    console.log('  - server:', server);
    console.log('  - login:', login);
    console.log(
      '  - investor_password (chiffré, longueur):',
      encryptedPassword.length
    );

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

/**
 * Route API pour supprimer un compte de trading
 */
export async function DELETE(request: NextRequest) {
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

    // Récupérer l'ID du compte depuis les paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json(
        { error: 'ID manquant', message: "L'ID du compte est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le compte appartient à l'utilisateur
    const { data: account, error: fetchError } = await supabase
      .from('trading_accounts')
      .select('id, user_id')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      return NextResponse.json(
        { error: 'Compte non trouvé', message: "Le compte n'existe pas" },
        { status: 404 }
      );
    }

    if (account.user_id !== user.id) {
      return NextResponse.json(
        {
          error: 'Non autorisé',
          message: "Vous n'êtes pas autorisé à supprimer ce compte"
        },
        { status: 403 }
      );
    }

    // Supprimer le compte
    const { error: deleteError } = await supabase
      .from('trading_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Erreur Supabase lors de la suppression:', deleteError);
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: deleteError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Compte supprimé avec succès'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la suppression du compte:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
