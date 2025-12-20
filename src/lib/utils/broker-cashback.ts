/**
 * Utilitaires pour le calcul du cashback basé sur les brokers
 */

// Taux de cashback par broker (en pourcentage)
// Exemple: 0.2 = 20% du montant de base
export const BROKER_CASHBACK_RATES: Record<string, number> = {
  'IC Markets': 0.2,
  Pepperstone: 0.18,
  XM: 0.25,
  Exness: 0.22,
  FBS: 0.3,
  RoboForex: 0.15,
  Vantage: 0.2
};

// Montant de base par lot pour le calcul du cashback (en USD)
// Si la commission n'est pas disponible, on utilise ce montant
const BASE_AMOUNT_PER_LOT = 10; // 10$ par lot comme base

/**
 * Obtient le taux de cashback pour un broker donné
 */
export function getBrokerCashbackRate(brokerName: string): number {
  return BROKER_CASHBACK_RATES[brokerName] || 0.15; // 15% par défaut
}

/**
 * Calcule le cashback pour un trade
 * Formule: cashback = (commission || (lots * BASE_AMOUNT_PER_LOT)) * cashback_rate
 */
export function calculateCashbackForTrade(
  brokerName: string,
  lots: number,
  commission?: number
): number {
  const cashbackRate = getBrokerCashbackRate(brokerName);
  const baseAmount =
    commission !== undefined && commission > 0
      ? commission
      : lots * BASE_AMOUNT_PER_LOT;

  return baseAmount * cashbackRate;
}
