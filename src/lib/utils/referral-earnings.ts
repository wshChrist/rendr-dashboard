/**
 * Utilitaires pour le calcul des gains de parrainage
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  calculateCashbackForTrade,
  calculateRendREarnings
} from './broker-cashback';

/**
 * Calcule et enregistre les gains de parrainage pour un trade
 * @param tradeId - ID du trade dans la table trades
 * @param userId - ID de l'utilisateur qui a fait le trade (filleul)
 * @param brokerName - Nom du broker
 * @param symbol - Symbole du trade (ex: "EURUSD", "XAUUSD")
 * @param lots - Nombre de lots tradés
 */
export async function calculateAndRecordReferralEarnings(
  tradeId: string,
  userId: string,
  brokerName: string,
  symbol: string,
  lots: number
) {
  const supabase = createServiceRoleClient();

  try {
    // Trouver la relation de parrainage (qui est le parrain de cet utilisateur)
    const { data: referralRelationship, error: relationshipError } =
      await supabase
        .from('referral_relationships')
        .select('referrer_id, status')
        .eq('referred_id', userId)
        .eq('status', 'active')
        .single();

    if (relationshipError || !referralRelationship) {
      // Pas de relation de parrainage active, pas de gains à enregistrer
      return;
    }

    const referrerId = referralRelationship.referrer_id;

    // Calculer le montant total que RendR gagne sur ce trade
    const rendREarnings = calculateRendREarnings(brokerName, symbol, lots);

    // Le trader reçoit 50% de ce que RendR gagne (cashback)
    const cashbackAmount = rendREarnings * 0.5;

    // RendR garde 50% de ce qu'il gagne
    const rendRShare = rendREarnings * 0.5;

    // Taux de commission parrain : 10% de la part de RendR
    // Le parrain reçoit 10% de ce que RendR garde (50% du total)
    // Cela équivaut à 10% * 50% = 5% du montant total gagné par RendR
    const commissionRate = 10.0; // TODO: Rendre configurable par utilisateur
    const commissionAmount = (rendRShare * commissionRate) / 100;

    // Période actuelle (format: YYYY-MM)
    const period = new Date().toISOString().slice(0, 7);

    // Enregistrer les gains de parrainage
    const { error: insertError } = await supabase
      .from('referral_earnings')
      .insert({
        referrer_id: referrerId,
        referred_id: userId,
        trade_id: tradeId,
        cashback_amount: cashbackAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending',
        period: period
      });

    if (insertError) {
      console.error(
        "Erreur lors de l'enregistrement des gains de parrainage:",
        insertError
      );
    }
  } catch (error) {
    console.error('Erreur lors du calcul des gains de parrainage:', error);
  }
}

/**
 * Met à jour le statut des relations de parrainage de 'pending' à 'active'
 * lorsqu'un compte de trading est connecté
 * @param userId - ID de l'utilisateur qui vient de connecter un compte
 */
export async function activateReferralRelationships(userId: string) {
  const supabase = createServiceRoleClient();

  try {
    // Mettre à jour toutes les relations où cet utilisateur est parrainé
    // et où il n'y a pas encore de relation active
    const { error: updateError } = await supabase
      .from('referral_relationships')
      .update({ status: 'active' })
      .eq('referred_id', userId)
      .eq('status', 'pending');

    if (updateError) {
      console.error(
        "Erreur lors de l'activation des relations de parrainage:",
        updateError
      );
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'activation des relations de parrainage:",
      error
    );
  }
}
