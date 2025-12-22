import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Route API pour enregistrer une relation de parrainage lors de l'inscription
 * Appelée après l'inscription d'un nouvel utilisateur avec un code de parrainage
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

    if (!referral_code) {
      return NextResponse.json(
        {
          error: 'Code de parrainage manquant',
          message: 'Le code de parrainage est requis'
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'a pas déjà de relation de parrainage
    const { data: existingRelationship } = await supabase
      .from('referral_relationships')
      .select('id')
      .eq('referred_id', user.id)
      .single();

    if (existingRelationship) {
      return NextResponse.json(
        {
          error: 'Déjà parrainé',
          message: 'Vous avez déjà été parrainé par un utilisateur'
        },
        { status: 400 }
      );
    }

    // Trouver le parrain par son code
    const { data: referrer, error: referrerError } = await supabase
      .from('referrals')
      .select('user_id')
      .eq('referral_code', referral_code)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        {
          error: 'Code invalide',
          message: "Le code de parrainage n'est pas valide"
        },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur ne s'est pas parrainé lui-même
    if (referrer.user_id === user.id) {
      return NextResponse.json(
        {
          error: 'Code invalide',
          message: 'Vous ne pouvez pas utiliser votre propre code de parrainage'
        },
        { status: 400 }
      );
    }

    // Créer la relation de parrainage
    const { data: relationship, error: insertError } = await supabase
      .from('referral_relationships')
      .insert({
        referrer_id: referrer.user_id,
        referred_id: user.id,
        status: 'pending' // Sera mis à 'active' une fois qu'un compte de trading est connecté
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur lors de la création de la relation:', insertError);
      return NextResponse.json(
        {
          error: 'Erreur de base de données',
          message: insertError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Relation de parrainage créée avec succès',
        relationship
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'enregistrement du parrainage:", error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
