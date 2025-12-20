import {
  Broker,
  UserBroker,
  Transaction,
  Withdrawal,
  UserStats,
  MonthlyStats,
  BrokerStats
} from '@/types/cashback';

// Liste des brokers partenaires
export const brokersData: Broker[] = [
  {
    id: 'broker-1',
    name: 'IC Markets',
    logo_url: '/brokers/icmarkets.png',
    category: 'forex',
    cashback_rate: 0.2, // 20% du spread
    min_withdrawal: 50,
    description:
      'Leader mondial du trading forex avec des spreads ultra-serrés',
    website_url: 'https://icmarkets.com',
    supported_pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF'],
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'broker-2',
    name: 'Pepperstone',
    logo_url: '/brokers/pepperstone.png',
    category: 'forex',
    cashback_rate: 0.18,
    min_withdrawal: 50,
    description: 'Broker régulé avec une exécution rapide',
    website_url: 'https://pepperstone.com',
    supported_pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'EUR/GBP', 'NZD/USD'],
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'broker-3',
    name: 'XM',
    logo_url: '/brokers/xm.png',
    category: 'forex',
    cashback_rate: 0.25,
    min_withdrawal: 30,
    description: 'Plus de 5 millions de clients dans 196 pays',
    website_url: 'https://xm.com',
    supported_pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/JPY'],
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'broker-4',
    name: 'Exness',
    logo_url: '/brokers/exness.png',
    category: 'forex',
    cashback_rate: 0.22,
    min_withdrawal: 25,
    description: 'Retraits instantanés et leverage flexible',
    website_url: 'https://exness.com',
    supported_pairs: ['EUR/USD', 'GBP/USD', 'XAU/USD', 'USD/JPY', 'GBP/JPY'],
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'broker-5',
    name: 'FBS',
    logo_url: '/brokers/fbs.png',
    category: 'forex',
    cashback_rate: 0.3,
    min_withdrawal: 20,
    description: 'Broker populaire avec bonus attractifs',
    website_url: 'https://fbs.com',
    supported_pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'EUR/JPY', 'CHF/JPY'],
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'broker-6',
    name: 'RoboForex',
    logo_url: '/brokers/roboforex.png',
    category: 'multi',
    cashback_rate: 0.15,
    min_withdrawal: 10,
    description: 'Plus de 12 000 instruments de trading',
    website_url: 'https://roboforex.com',
    supported_pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/NZD', 'EUR/AUD'],
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'broker-7',
    name: 'Vantage',
    logo_url: '/brokers/vantage.png',
    category: 'forex',
    cashback_rate: 0.2, // 20% du spread
    min_withdrawal: 50,
    description:
      'Broker forex régulé avec spreads compétitifs et exécution rapide',
    website_url: 'https://www.vantagemarkets.com',
    supported_pairs: [
      'EUR/USD',
      'GBP/USD',
      'USD/JPY',
      'AUD/USD',
      'XAU/USD',
      'EUR/GBP',
      'USD/CHF'
    ],
    created_at: '2024-01-01T00:00:00Z'
  }
];

// Comptes broker de l'utilisateur (mock)
export const userBrokersData: UserBroker[] = [
  {
    id: 'ub-1',
    user_id: 'user-1',
    broker_id: 'broker-1',
    broker: brokersData[0],
    account_id: 'ICM-123456',
    status: 'active',
    linked_at: '2024-06-15T10:00:00Z',
    total_volume: 125.5,
    total_cashback: 487.25
  },
  {
    id: 'ub-2',
    user_id: 'user-1',
    broker_id: 'broker-3',
    broker: brokersData[2],
    account_id: 'XM-789012',
    status: 'active',
    linked_at: '2024-08-20T14:30:00Z',
    total_volume: 78.3,
    total_cashback: 312.8
  },
  {
    id: 'ub-3',
    user_id: 'user-1',
    broker_id: 'broker-4',
    broker: brokersData[3],
    account_id: 'EX-345678',
    status: 'pending',
    linked_at: '2024-12-10T09:15:00Z',
    total_volume: 0,
    total_cashback: 0
  }
];

// Transactions/Trades de l'utilisateur (mock)
export const transactionsData: Transaction[] = [
  // Décembre 2024 - Trades récents
  {
    id: 'tx-1',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-156',
    pair: 'EUR/USD',
    volume: 2.5,
    commission: 25.0,
    cashback_amount: 5.0,
    status: 'pending',
    trade_date: '2024-12-18T09:30:00Z',
    created_at: '2024-12-18T09:35:00Z'
  },
  {
    id: 'tx-2',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-089',
    pair: 'XAU/USD',
    volume: 0.5,
    commission: 45.0,
    cashback_amount: 11.25,
    status: 'pending',
    trade_date: '2024-12-18T08:15:00Z',
    created_at: '2024-12-18T08:20:00Z'
  },
  {
    id: 'tx-3',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-155',
    pair: 'GBP/USD',
    volume: 1.0,
    commission: 12.5,
    cashback_amount: 2.5,
    status: 'confirmed',
    trade_date: '2024-12-17T16:45:00Z',
    created_at: '2024-12-17T16:50:00Z'
  },
  {
    id: 'tx-4',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-088',
    pair: 'USD/JPY',
    volume: 3.0,
    commission: 18.0,
    cashback_amount: 4.5,
    status: 'confirmed',
    trade_date: '2024-12-17T14:30:00Z',
    created_at: '2024-12-17T14:35:00Z'
  },
  {
    id: 'tx-5',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-154',
    pair: 'EUR/USD',
    volume: 5.0,
    commission: 50.0,
    cashback_amount: 10.0,
    status: 'confirmed',
    trade_date: '2024-12-17T11:00:00Z',
    created_at: '2024-12-17T11:05:00Z'
  },
  {
    id: 'tx-6',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-087',
    pair: 'GBP/JPY',
    volume: 2.0,
    commission: 22.0,
    cashback_amount: 5.5,
    status: 'confirmed',
    trade_date: '2024-12-16T15:20:00Z',
    created_at: '2024-12-16T15:25:00Z'
  },
  {
    id: 'tx-7',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-153',
    pair: 'AUD/USD',
    volume: 1.5,
    commission: 15.0,
    cashback_amount: 3.0,
    status: 'confirmed',
    trade_date: '2024-12-16T10:30:00Z',
    created_at: '2024-12-16T10:35:00Z'
  },
  {
    id: 'tx-8',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-086',
    pair: 'EUR/GBP',
    volume: 4.0,
    commission: 28.0,
    cashback_amount: 7.0,
    status: 'confirmed',
    trade_date: '2024-12-15T17:45:00Z',
    created_at: '2024-12-15T17:50:00Z'
  },
  {
    id: 'tx-9',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-152',
    pair: 'USD/CHF',
    volume: 2.0,
    commission: 20.0,
    cashback_amount: 4.0,
    status: 'confirmed',
    trade_date: '2024-12-15T14:00:00Z',
    created_at: '2024-12-15T14:05:00Z'
  },
  {
    id: 'tx-10',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-085',
    pair: 'NZD/USD',
    volume: 1.0,
    commission: 8.5,
    cashback_amount: 2.13,
    status: 'confirmed',
    trade_date: '2024-12-14T09:15:00Z',
    created_at: '2024-12-14T09:20:00Z'
  },
  {
    id: 'tx-11',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-151',
    pair: 'EUR/USD',
    volume: 3.5,
    commission: 35.0,
    cashback_amount: 7.0,
    status: 'confirmed',
    trade_date: '2024-12-13T16:30:00Z',
    created_at: '2024-12-13T16:35:00Z'
  },
  {
    id: 'tx-12',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-084',
    pair: 'USD/CAD',
    volume: 2.5,
    commission: 17.5,
    cashback_amount: 4.38,
    status: 'confirmed',
    trade_date: '2024-12-13T11:45:00Z',
    created_at: '2024-12-13T11:50:00Z'
  },
  {
    id: 'tx-13',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-150',
    pair: 'GBP/USD',
    volume: 1.5,
    commission: 18.75,
    cashback_amount: 3.75,
    status: 'confirmed',
    trade_date: '2024-12-12T14:20:00Z',
    created_at: '2024-12-12T14:25:00Z'
  },
  {
    id: 'tx-14',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-083',
    pair: 'EUR/JPY',
    volume: 2.0,
    commission: 16.0,
    cashback_amount: 4.0,
    status: 'confirmed',
    trade_date: '2024-12-12T09:00:00Z',
    created_at: '2024-12-12T09:05:00Z'
  },
  {
    id: 'tx-15',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-149',
    pair: 'XAU/USD',
    volume: 1.0,
    commission: 90.0,
    cashback_amount: 18.0,
    status: 'confirmed',
    trade_date: '2024-12-11T15:30:00Z',
    created_at: '2024-12-11T15:35:00Z'
  },
  {
    id: 'tx-16',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-082',
    pair: 'AUD/JPY',
    volume: 3.0,
    commission: 21.0,
    cashback_amount: 5.25,
    status: 'confirmed',
    trade_date: '2024-12-11T10:15:00Z',
    created_at: '2024-12-11T10:20:00Z'
  },
  {
    id: 'tx-17',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-148',
    pair: 'EUR/USD',
    volume: 2.0,
    commission: 20.0,
    cashback_amount: 4.0,
    status: 'confirmed',
    trade_date: '2024-12-10T16:45:00Z',
    created_at: '2024-12-10T16:50:00Z'
  },
  {
    id: 'tx-18',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-081',
    pair: 'GBP/CHF',
    volume: 1.5,
    commission: 19.5,
    cashback_amount: 4.88,
    status: 'confirmed',
    trade_date: '2024-12-10T11:00:00Z',
    created_at: '2024-12-10T11:05:00Z'
  },
  {
    id: 'tx-19',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-147',
    pair: 'USD/JPY',
    volume: 4.0,
    commission: 32.0,
    cashback_amount: 6.4,
    status: 'confirmed',
    trade_date: '2024-12-09T15:20:00Z',
    created_at: '2024-12-09T15:25:00Z'
  },
  {
    id: 'tx-20',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-080',
    pair: 'EUR/AUD',
    volume: 2.0,
    commission: 22.0,
    cashback_amount: 5.5,
    status: 'confirmed',
    trade_date: '2024-12-09T09:30:00Z',
    created_at: '2024-12-09T09:35:00Z'
  },
  // Novembre 2024 - Trades plus anciens
  {
    id: 'tx-21',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-146',
    pair: 'GBP/USD',
    volume: 3.0,
    commission: 37.5,
    cashback_amount: 7.5,
    status: 'confirmed',
    trade_date: '2024-11-28T14:00:00Z',
    created_at: '2024-11-28T14:05:00Z'
  },
  {
    id: 'tx-22',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-079',
    pair: 'EUR/USD',
    volume: 5.0,
    commission: 40.0,
    cashback_amount: 10.0,
    status: 'confirmed',
    trade_date: '2024-11-27T11:30:00Z',
    created_at: '2024-11-27T11:35:00Z'
  },
  {
    id: 'tx-23',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-145',
    pair: 'USD/CHF',
    volume: 1.5,
    commission: 15.0,
    cashback_amount: 3.0,
    status: 'confirmed',
    trade_date: '2024-11-25T16:15:00Z',
    created_at: '2024-11-25T16:20:00Z'
  },
  {
    id: 'tx-24',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-078',
    pair: 'GBP/JPY',
    volume: 2.5,
    commission: 27.5,
    cashback_amount: 6.88,
    status: 'confirmed',
    trade_date: '2024-11-22T10:45:00Z',
    created_at: '2024-11-22T10:50:00Z'
  },
  {
    id: 'tx-25',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-144',
    pair: 'AUD/USD',
    volume: 2.0,
    commission: 20.0,
    cashback_amount: 4.0,
    status: 'confirmed',
    trade_date: '2024-11-20T15:00:00Z',
    created_at: '2024-11-20T15:05:00Z'
  },
  {
    id: 'tx-26',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-077',
    pair: 'XAU/USD',
    volume: 0.8,
    commission: 72.0,
    cashback_amount: 18.0,
    status: 'confirmed',
    trade_date: '2024-11-18T09:20:00Z',
    created_at: '2024-11-18T09:25:00Z'
  },
  {
    id: 'tx-27',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-143',
    pair: 'EUR/GBP',
    volume: 3.5,
    commission: 24.5,
    cashback_amount: 4.9,
    status: 'confirmed',
    trade_date: '2024-11-15T14:30:00Z',
    created_at: '2024-11-15T14:35:00Z'
  },
  {
    id: 'tx-28',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-076',
    pair: 'USD/CAD',
    volume: 4.0,
    commission: 28.0,
    cashback_amount: 7.0,
    status: 'confirmed',
    trade_date: '2024-11-12T11:00:00Z',
    created_at: '2024-11-12T11:05:00Z'
  },
  {
    id: 'tx-29',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-142',
    pair: 'NZD/USD',
    volume: 1.0,
    commission: 8.5,
    cashback_amount: 1.7,
    status: 'confirmed',
    trade_date: '2024-11-10T16:45:00Z',
    created_at: '2024-11-10T16:50:00Z'
  },
  {
    id: 'tx-30',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-075',
    pair: 'EUR/USD',
    volume: 6.0,
    commission: 48.0,
    cashback_amount: 12.0,
    status: 'confirmed',
    trade_date: '2024-11-08T10:15:00Z',
    created_at: '2024-11-08T10:20:00Z'
  },
  {
    id: 'tx-31',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-141',
    pair: 'GBP/USD',
    volume: 2.5,
    commission: 31.25,
    cashback_amount: 6.25,
    status: 'confirmed',
    trade_date: '2024-11-05T15:30:00Z',
    created_at: '2024-11-05T15:35:00Z'
  },
  {
    id: 'tx-32',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-074',
    pair: 'USD/JPY',
    volume: 3.0,
    commission: 24.0,
    cashback_amount: 6.0,
    status: 'confirmed',
    trade_date: '2024-11-02T09:00:00Z',
    created_at: '2024-11-02T09:05:00Z'
  },
  // Octobre 2024
  {
    id: 'tx-33',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-140',
    pair: 'EUR/JPY',
    volume: 2.0,
    commission: 16.0,
    cashback_amount: 3.2,
    status: 'confirmed',
    trade_date: '2024-10-30T14:45:00Z',
    created_at: '2024-10-30T14:50:00Z'
  },
  {
    id: 'tx-34',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-073',
    pair: 'GBP/CHF',
    volume: 1.5,
    commission: 19.5,
    cashback_amount: 4.88,
    status: 'confirmed',
    trade_date: '2024-10-28T11:20:00Z',
    created_at: '2024-10-28T11:25:00Z'
  },
  {
    id: 'tx-35',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-139',
    pair: 'XAU/USD',
    volume: 0.5,
    commission: 45.0,
    cashback_amount: 9.0,
    status: 'confirmed',
    trade_date: '2024-10-25T16:00:00Z',
    created_at: '2024-10-25T16:05:00Z'
  },
  {
    id: 'tx-36',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-072',
    pair: 'AUD/JPY',
    volume: 4.0,
    commission: 28.0,
    cashback_amount: 7.0,
    status: 'confirmed',
    trade_date: '2024-10-22T10:30:00Z',
    created_at: '2024-10-22T10:35:00Z'
  },
  {
    id: 'tx-37',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-138',
    pair: 'EUR/USD',
    volume: 7.0,
    commission: 70.0,
    cashback_amount: 14.0,
    status: 'confirmed',
    trade_date: '2024-10-20T15:15:00Z',
    created_at: '2024-10-20T15:20:00Z'
  },
  {
    id: 'tx-38',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-071',
    pair: 'EUR/AUD',
    volume: 2.5,
    commission: 27.5,
    cashback_amount: 6.88,
    status: 'confirmed',
    trade_date: '2024-10-18T09:45:00Z',
    created_at: '2024-10-18T09:50:00Z'
  },
  {
    id: 'tx-39',
    user_id: 'user-1',
    user_broker_id: 'ub-1',
    broker: brokersData[0],
    trade_id: 'ICM-T-137',
    pair: 'GBP/USD',
    volume: 3.0,
    commission: 37.5,
    cashback_amount: 7.5,
    status: 'confirmed',
    trade_date: '2024-10-15T14:00:00Z',
    created_at: '2024-10-15T14:05:00Z'
  },
  {
    id: 'tx-40',
    user_id: 'user-1',
    user_broker_id: 'ub-2',
    broker: brokersData[2],
    trade_id: 'XM-T-070',
    pair: 'USD/CHF',
    volume: 1.0,
    commission: 10.0,
    cashback_amount: 2.5,
    status: 'confirmed',
    trade_date: '2024-10-12T11:30:00Z',
    created_at: '2024-10-12T11:35:00Z'
  }
];

// Historique des retraits (mock)
export const withdrawalsData: Withdrawal[] = [
  {
    id: 'wd-1',
    user_id: 'user-1',
    amount: 150.0,
    status: 'completed',
    payment_method: 'bank_transfer',
    payment_details: 'FR76 **** **** 1234',
    requested_at: '2024-11-20T10:00:00Z',
    processed_at: '2024-11-22T14:30:00Z',
    transaction_ref: 'TRF-2024-001'
  },
  {
    id: 'wd-2',
    user_id: 'user-1',
    amount: 200.0,
    status: 'completed',
    payment_method: 'paypal',
    payment_details: 'user@email.com',
    requested_at: '2024-10-15T09:00:00Z',
    processed_at: '2024-10-16T11:00:00Z',
    transaction_ref: 'PP-2024-002'
  },
  {
    id: 'wd-3',
    user_id: 'user-1',
    amount: 100.0,
    status: 'processing',
    payment_method: 'crypto',
    payment_details: '0x1234...abcd (USDT)',
    requested_at: '2024-12-14T16:00:00Z'
  }
];

// Statistiques utilisateur (mock) - Calculées à partir des transactions
export const userStatsData: UserStats = {
  total_cashback_earned: 248.29,
  available_balance: 148.29,
  pending_cashback: 16.25,
  total_withdrawn: 100.0,
  total_volume: 102.3,
  total_trades: 40,
  active_brokers: 2
};

// Statistiques mensuelles (mock)
export const monthlyStatsData: MonthlyStats[] = [
  { month: 'Juillet', cashback: 45.5, volume: 12.5, trades: 8 },
  { month: 'Août', cashback: 78.25, volume: 22.3, trades: 15 },
  { month: 'Septembre', cashback: 125.0, volume: 35.0, trades: 22 },
  { month: 'Octobre', cashback: 198.3, volume: 52.8, trades: 38 },
  { month: 'Novembre', cashback: 245.5, volume: 58.2, trades: 45 },
  { month: 'Décembre', cashback: 107.5, volume: 23.0, trades: 28 }
];

// Statistiques par broker (mock)
export const brokerStatsData: BrokerStats[] = [
  {
    broker_id: 'broker-1',
    broker_name: 'IC Markets',
    cashback: 487.25,
    volume: 125.5,
    trades: 89
  },
  {
    broker_id: 'broker-3',
    broker_name: 'XM',
    cashback: 312.8,
    volume: 78.3,
    trades: 67
  }
];

// Top paires tradées
export const topPairsData = [
  { pair: 'EUR/USD', volume: 85.5, trades: 62, cashback: 320.5 },
  { pair: 'GBP/USD', volume: 45.2, trades: 38, cashback: 175.3 },
  { pair: 'USD/JPY', volume: 35.8, trades: 28, cashback: 142.25 },
  { pair: 'GBP/JPY', volume: 22.3, trades: 18, cashback: 98.0 },
  { pair: 'AUD/USD', volume: 15.0, trades: 10, cashback: 64.0 }
];

// Activité récente
export interface RecentActivity {
  id: string;
  type: 'trade' | 'withdrawal' | 'broker_linked';
  description: string;
  amount?: number;
  date: string;
  broker?: string;
}

export const recentActivityData: RecentActivity[] = [
  {
    id: 'act-1',
    type: 'trade',
    description: 'Trade EUR/USD exécuté',
    amount: 10.0,
    date: '2024-12-16T11:00:00Z',
    broker: 'IC Markets'
  },
  {
    id: 'act-2',
    type: 'withdrawal',
    description: 'Retrait en cours de traitement',
    amount: 100.0,
    date: '2024-12-14T16:00:00Z'
  },
  {
    id: 'act-3',
    type: 'trade',
    description: 'Trade GBP/USD exécuté',
    amount: 2.5,
    date: '2024-12-14T09:15:00Z',
    broker: 'IC Markets'
  },
  {
    id: 'act-4',
    type: 'broker_linked',
    description: 'Compte Exness en attente de validation',
    date: '2024-12-10T09:15:00Z',
    broker: 'Exness'
  },
  {
    id: 'act-5',
    type: 'trade',
    description: 'Trade USD/JPY exécuté',
    amount: 4.5,
    date: '2024-12-13T16:45:00Z',
    broker: 'XM'
  }
];
