/**
 * Utilitaires pour le calcul du cashback basé sur les brokers
 * Utilise des montants fixes par lot selon le broker et le type d'instrument
 */

// Type d'instrument de trading
export type InstrumentType = 'forex' | 'gold' | 'silver' | 'oil';

/**
 * Montant par lot que RendR gagne selon le broker et le type d'instrument (en USD)
 * Structure: { [brokerName]: { [instrumentType]: montant_par_lot } }
 */
export const BROKER_EARNINGS_PER_LOT: Record<
  string,
  Partial<Record<InstrumentType, number>>
> = {
  Vantage: {
    forex: 8, // 8$/lot pour forex, or, pétrole
    gold: 8,
    oil: 8,
    silver: 1 // 1$/lot pour l'argent
  }
  // Ajouter d'autres brokers ici avec leurs montants respectifs
  // 'IC Markets': { forex: X, gold: Y, ... },
  // 'Pepperstone': { forex: X, gold: Y, ... },
  // etc.
};

// Montant par défaut si le broker/instrument n'est pas configuré (en USD)
const DEFAULT_EARNINGS_PER_LOT = 5; // 5$/lot par défaut

/**
 * Exemples de configuration pour d'autres brokers :
 *
 * 'IC Markets': {
 *   forex: 7,    // 7$/lot pour forex
 *   gold: 7,     // 7$/lot pour l'or
 *   silver: 0.8, // 0.8$/lot pour l'argent
 *   oil: 7       // 7$/lot pour le pétrole
 * },
 * 'Pepperstone': {
 *   forex: 6.5,
 *   gold: 6.5,
 *   silver: 0.7,
 *   oil: 6.5
 * },
 * etc.
 */

/**
 * Détermine le type d'instrument à partir du symbole du trade
 * @param symbol - Symbole du trade (ex: "EURUSD", "XAUUSD", "XAGUSD", "XTIUSD")
 * @returns Le type d'instrument
 */
export function getInstrumentType(symbol: string): InstrumentType {
  const upperSymbol = symbol.toUpperCase();

  // Or (Gold)
  if (
    upperSymbol.includes('XAU') ||
    upperSymbol.includes('GOLD') ||
    upperSymbol === 'AU'
  ) {
    return 'gold';
  }

  // Argent (Silver)
  if (
    upperSymbol.includes('XAG') ||
    upperSymbol.includes('SILVER') ||
    upperSymbol === 'AG'
  ) {
    return 'silver';
  }

  // Pétrole (Oil)
  if (
    upperSymbol.includes('XTI') ||
    upperSymbol.includes('WTI') ||
    upperSymbol.includes('CRUDE') ||
    upperSymbol.includes('OIL') ||
    upperSymbol.includes('CL')
  ) {
    return 'oil';
  }

  // Par défaut, considérer comme forex
  return 'forex';
}

/**
 * Obtient le montant par lot que RendR gagne pour un broker et type d'instrument donné
 * @param brokerName - Nom du broker
 * @param instrumentType - Type d'instrument
 * @returns Montant en USD par lot
 */
export function getBrokerEarningsPerLot(
  brokerName: string,
  instrumentType: InstrumentType
): number {
  const brokerEarnings = BROKER_EARNINGS_PER_LOT[brokerName];
  if (brokerEarnings && brokerEarnings[instrumentType] !== undefined) {
    return brokerEarnings[instrumentType]!;
  }

  // Si pas de configuration spécifique, utiliser la valeur par défaut
  return DEFAULT_EARNINGS_PER_LOT;
}

/**
 * Calcule le montant total que RendR gagne sur un trade
 * @param brokerName - Nom du broker
 * @param symbol - Symbole du trade
 * @param lots - Nombre de lots tradés
 * @returns Le montant total gagné par RendR (avant partage)
 */
export function calculateRendREarnings(
  brokerName: string,
  symbol: string,
  lots: number
): number {
  const instrumentType = getInstrumentType(symbol);
  const earningsPerLot = getBrokerEarningsPerLot(brokerName, instrumentType);
  return lots * earningsPerLot;
}

/**
 * Calcule le cashback pour un trade (50% de ce que RendR gagne)
 * @param brokerName - Nom du broker
 * @param symbol - Symbole du trade
 * @param lots - Nombre de lots tradés
 * @returns Le cashback du trader (50% de ce que RendR gagne)
 */
export function calculateCashbackForTrade(
  brokerName: string,
  symbol: string,
  lots: number
): number {
  const rendREarnings = calculateRendREarnings(brokerName, symbol, lots);
  // Le trader reçoit 50% de ce que RendR gagne
  return rendREarnings * 0.5;
}

// ============================================================================
// NOUVELLES FONCTIONS POUR LE CALCUL DU CASHBACK SELON LA FORMULE FOURNIE
// ============================================================================

/**
 * Configuration des coûts par broker pour le calcul du cashback réel
 * Structure: { [brokerName]: { spreadPips: number, commissionRoundTurn?: number, accountType: 'standard' | 'ecn' } }
 */
export interface BrokerCostConfig {
  spreadPips: number; // Spread moyen en pips (ex: 0.9 pour IC Markets Standard)
  commissionRoundTurn?: number; // Commission round-turn en USD (pour comptes ECN)
  accountType: 'standard' | 'ecn'; // Type de compte
}

export const BROKER_COST_CONFIG: Record<string, BrokerCostConfig> = {
  'IC Markets': {
    spreadPips: 0.9,
    accountType: 'standard'
  },
  Vantage: {
    spreadPips: 1.0,
    accountType: 'standard'
  }
  // Ajouter d'autres brokers ici
  // 'Pepperstone': { spreadPips: 0.8, accountType: 'standard' },
  // 'Exness': { spreadPips: 1.2, commissionRoundTurn: 3.5, accountType: 'ecn' },
};

/**
 * Calcule le coût réel par lot pour un trader
 *
 * Pour un compte Standard/STP sans commission :
 * Coût = Spread (en pips) × 10 dollars
 *
 * Pour un compte ECN avec commission :
 * Coût = Spread (pips) × 10 + Commission round-turn
 *
 * @param brokerName - Nom du broker
 * @returns Le coût par lot en USD, ou null si le broker n'est pas configuré
 */
export function calculateTraderCostPerLot(brokerName: string): number | null {
  const config = BROKER_COST_CONFIG[brokerName];
  if (!config) {
    return null;
  }

  // Coût de base : spread en pips × 10 dollars
  const spreadCost = config.spreadPips * 10;

  // Pour les comptes ECN, ajouter la commission round-turn
  if (config.accountType === 'ecn' && config.commissionRoundTurn) {
    return spreadCost + config.commissionRoundTurn;
  }

  return spreadCost;
}

/**
 * Calcule le pourcentage de cashback sur le revenu IB
 * Formule: CB_IB = (C / R) × 100
 *
 * @param cashbackAmount - Montant que RendR reverse au trader (C)
 * @param brokerRevenue - Montant que le broker paie à RendR (R)
 * @returns Le pourcentage de cashback sur le revenu IB
 */
export function calculateCashbackOnIBRevenue(
  cashbackAmount: number,
  brokerRevenue: number
): number {
  if (brokerRevenue === 0) {
    return 0;
  }
  return (cashbackAmount / brokerRevenue) * 100;
}

/**
 * Calcule le pourcentage de cashback réel par rapport au coût du trader
 * Formule: CB_réel = (C / Coût trader) × 100
 *
 * C'est le pourcentage marketing qui montre combien du coût réel du trader est remboursé
 *
 * @param cashbackAmount - Montant que RendR reverse au trader (C)
 * @param traderCostPerLot - Coût réel par lot pour le trader
 * @returns Le pourcentage de cashback réel
 */
export function calculateRealCashbackPercentage(
  cashbackAmount: number,
  traderCostPerLot: number
): number {
  if (traderCostPerLot === 0) {
    return 0;
  }
  return (cashbackAmount / traderCostPerLot) * 100;
}

/**
 * Calcule le montant de cashback à rembourser au trader selon la formule
 *
 * Cette fonction détermine le montant maximum de cashback que RendR peut rembourser
 * en fonction du revenu IB et du pourcentage de partage configuré.
 *
 * @param brokerName - Nom du broker
 * @param symbol - Symbole du trade
 * @param lots - Nombre de lots tradés
 * @param sharingPercentage - Pourcentage de partage (ex: 0.5 pour 50%, 0.6 pour 60%)
 * @returns Le montant de cashback à rembourser au trader
 */
export function calculateCashbackAmount(
  brokerName: string,
  symbol: string,
  lots: number,
  sharingPercentage: number = 0.5
): number {
  // R : Montant que le broker paie à RendR
  const brokerRevenue = calculateRendREarnings(brokerName, symbol, lots);

  // C : Ce que RendR reverse au trader (basé sur le pourcentage de partage)
  const cashbackAmount = brokerRevenue * sharingPercentage;

  return cashbackAmount;
}

/**
 * Calcule toutes les métriques de cashback pour un trade donné
 *
 * @param brokerName - Nom du broker
 * @param symbol - Symbole du trade
 * @param lots - Nombre de lots tradés
 * @param sharingPercentage - Pourcentage de partage (ex: 0.5 pour 50%)
 * @returns Un objet contenant toutes les métriques de cashback
 */
export interface CashbackMetrics {
  brokerRevenue: number; // R : Montant que le broker paie à RendR
  cashbackAmount: number; // C : Montant remboursé au trader
  cashbackOnIBRevenue: number; // % de cashback sur le revenu IB
  traderCostPerLot: number | null; // Coût réel par lot pour le trader
  realCashbackPercentage: number | null; // % de cashback réel (marketing)
}

export function calculateCashbackMetrics(
  brokerName: string,
  symbol: string,
  lots: number,
  sharingPercentage: number = 0.5
): CashbackMetrics {
  // R : Montant que le broker paie à RendR
  const brokerRevenue = calculateRendREarnings(brokerName, symbol, lots);

  // C : Ce que RendR reverse au trader
  const cashbackAmount = brokerRevenue * sharingPercentage;

  // % de cashback sur le revenu IB
  const cashbackOnIBRevenue = calculateCashbackOnIBRevenue(
    cashbackAmount,
    brokerRevenue
  );

  // Coût réel par lot pour le trader
  const traderCostPerLot = calculateTraderCostPerLot(brokerName);

  // % de cashback réel (marketing)
  const realCashbackPercentage = traderCostPerLot
    ? calculateRealCashbackPercentage(cashbackAmount, traderCostPerLot * lots)
    : null;

  return {
    brokerRevenue,
    cashbackAmount,
    cashbackOnIBRevenue,
    traderCostPerLot,
    realCashbackPercentage
  };
}

/**
 * Détermine le montant maximum de cashback à rembourser pour un nouveau broker
 *
 * Cette fonction aide à configurer un nouveau broker en calculant le montant
 * de cashback optimal basé sur le spread moyen et le revenu IB.
 *
 * @param brokerName - Nom du broker
 * @param averageSpreadPips - Spread moyen en pips (ex: 0.9 pour EUR/USD)
 * @param brokerRevenuePerLot - Montant que le broker paie par lot (R)
 * @param sharingPercentage - Pourcentage de partage souhaité (ex: 0.5 pour 50%)
 * @param accountType - Type de compte ('standard' ou 'ecn')
 * @param commissionRoundTurn - Commission round-turn en USD (pour comptes ECN, optionnel)
 * @returns Un objet avec les métriques calculées
 */
export function calculateCashbackForNewBroker(
  averageSpreadPips: number,
  brokerRevenuePerLot: number,
  sharingPercentage: number = 0.5,
  accountType: 'standard' | 'ecn' = 'standard',
  commissionRoundTurn?: number
): {
  cashbackPerLot: number;
  traderCostPerLot: number;
  realCashbackPercentage: number;
  cashbackOnIBRevenue: number;
} {
  // Calculer le coût réel par lot pour le trader
  const spreadCost = averageSpreadPips * 10;
  const traderCostPerLot =
    accountType === 'ecn' && commissionRoundTurn
      ? spreadCost + commissionRoundTurn
      : spreadCost;

  // Calculer le cashback par lot (C)
  const cashbackPerLot = brokerRevenuePerLot * sharingPercentage;

  // Calculer le % de cashback réel
  const realCashbackPercentage = (cashbackPerLot / traderCostPerLot) * 100;

  // Calculer le % de cashback sur le revenu IB
  const cashbackOnIBRevenue = (cashbackPerLot / brokerRevenuePerLot) * 100;

  return {
    cashbackPerLot,
    traderCostPerLot,
    realCashbackPercentage,
    cashbackOnIBRevenue
  };
}
