import type { Broker } from '@/types/cashback';

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

