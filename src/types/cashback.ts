// Types pour la plateforme de cashback traders

export type BrokerStatus = 'active' | 'pending' | 'inactive';
export type WithdrawalStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected';
export type TransactionStatus = 'confirmed' | 'pending';

export type BrokerCategory = 'forex' | 'crypto' | 'futures' | 'multi';

// Catégories de paires pour le paiement par lot
export type PairCategory =
  | 'majors'
  | 'minors'
  | 'exotics'
  | 'indices'
  | 'metals'
  | 'crypto';

// Structure pour les paiements par lot par catégorie de paires
export interface PayoutPerLotByCategory {
  majors?: number; // Paiement par lot pour les paires majeures (EUR/USD, GBP/USD, etc.)
  minors?: number; // Paiement par lot pour les paires mineures (EUR/GBP, EUR/JPY, etc.)
  exotics?: number; // Paiement par lot pour les paires exotiques
  indices?: number; // Paiement par lot pour les indices (US30, NAS100, etc.)
  metals?: number; // Paiement par lot pour les métaux (XAU/USD, XAG/USD, etc.)
  crypto?: number; // Paiement par lot pour les cryptomonnaies
}

export interface Broker {
  id: string;
  name: string;
  logo_url: string;
  category: BrokerCategory;
  cashback_rate: number; // Pourcentage de cashback (ex: 0.15 = 15%)
  min_withdrawal: number; // Montant minimum de retrait
  description: string;
  website_url: string;
  supported_pairs: string[]; // Paires forex supportées
  payout_per_lot_by_category?: PayoutPerLotByCategory; // Montants payés par lot par catégorie
  created_at: string;
}

export interface UserBroker {
  id: string;
  user_id: string;
  broker_id: string;
  broker: Broker;
  account_id: string; // ID du compte chez le broker
  status: BrokerStatus;
  linked_at: string;
  total_volume: number; // Volume total tradé
  total_cashback: number; // Total cashback généré
}

export interface Transaction {
  id: string;
  user_id: string;
  user_broker_id: string;
  broker: Broker;
  trade_id: string; // ID du trade chez le broker
  pair: string; // Ex: EUR/USD
  volume: number; // Volume en lots
  commission: number; // Commission payée au broker
  cashback_amount: number; // Montant du cashback
  status: TransactionStatus;
  trade_date: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: WithdrawalStatus;
  payment_method: 'bank_transfer' | 'paypal' | 'crypto';
  payment_details: string;
  requested_at: string;
  processed_at?: string;
  transaction_ref?: string;
}

export interface UserStats {
  total_cashback_earned: number;
  available_balance: number;
  pending_cashback: number;
  total_withdrawn: number;
  total_volume: number;
  total_trades: number;
  active_brokers: number;
}

export interface MonthlyStats {
  month: string;
  cashback: number;
  volume: number;
  trades: number;
}

export interface BrokerStats {
  broker_id: string;
  broker_name: string;
  cashback: number;
  volume: number;
  trades: number;
}
