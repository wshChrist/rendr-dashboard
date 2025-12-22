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
