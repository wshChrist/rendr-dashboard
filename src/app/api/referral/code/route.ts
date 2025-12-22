import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Route API pour créer ou mettre à jour le code de parrainage de l'utilisateur
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
    const { referral_code } = body;

    if (!referral_code || typeof referral_code !== 'string') {
      return NextResponse.json(
        {
          error: 'Code invalide',
          message:
            'Le code de parrainage est requis et doit être une chaîne de caractères'
        },
        { status: 400 }
      );
    }

    // Nettoyer et valider le code
    const cleanedCode = referral_code.trim().toUpperCase();

    if (cleanedCode.length < 3 || cleanedCode.length > 20) {
      return NextResponse.json(
        {
          error: 'Code invalide',
          message: 'Le code doit contenir entre 3 et 20 caractères'
        },
        { status: 400 }
      );
    }

    // Vérifier que le code ne contient que des caractères alphanumériques et tirets
    if (!/^[A-Z0-9-]+$/.test(cleanedCode)) {
      return NextResponse.json(
        {
          error: 'Code invalide',
          message:
            'Le code ne peut contenir que des lettres majuscules, chiffres et tirets'
        },
        { status: 400 }
      );
    }

    // Vérifier si le code est déjà utilisé par un autre utilisateur
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('user_id')
      .eq('referral_code', cleanedCode)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, ce qui est OK
      console.error('Erreur lors de la vérification du code:', checkError);
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: 'Erreur lors de la vérification du code'
        },
        { status: 500 }
      );
    }

    // Si le code existe et appartient à un autre utilisateur, c'est une erreur
    if (existingReferral && existingReferral.user_id !== user.id) {
      return NextResponse.json(
        {
          error: 'Code déjà utilisé',
          message:
            'Ce code de parrainage est déjà utilisé par un autre utilisateur'
        },
        { status: 409 }
      );
    }

    // Vérifier si l'utilisateur a déjà un code
    const { data: currentReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (currentReferral) {
      // Mettre à jour le code existant
      const { data: updatedReferral, error: updateError } = await supabase
        .from('referrals')
        .update({ referral_code: cleanedCode })
        .eq('user_id', user.id)
        .select('referral_code')
        .single();

      if (updateError) {
        console.error('Erreur lors de la mise à jour du code:', updateError);
        return NextResponse.json(
          {
            error: 'Erreur de base de données',
            message: updateError.message
          },
          { status: 500 }
        );
      }

      result = updatedReferral;
    } else {
      // Créer un nouveau code
      const { data: newReferral, error: insertError } = await supabase
        .from('referrals')
        .insert({
          user_id: user.id,
          referral_code: cleanedCode
        })
        .select('referral_code')
        .single();

      if (insertError) {
        console.error('Erreur lors de la création du code:', insertError);
        return NextResponse.json(
          {
            error: 'Erreur de base de données',
            message: insertError.message
          },
          { status: 500 }
        );
      }

      result = newReferral;
    }

    // Générer le lien de parrainage
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rendr.io';
    const referralLink = `${baseUrl}/auth/sign-up?ref=${result.referral_code}`;

    return NextResponse.json(
      {
        success: true,
        code: result.referral_code,
        link: referralLink,
        message: 'Code de parrainage créé avec succès'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création du code de parrainage:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
