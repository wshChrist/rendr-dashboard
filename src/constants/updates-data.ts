// Données des mises à jour de la plateforme
export interface PlatformUpdate {
  id: string;
  type: 'feature' | 'improvement' | 'fix' | 'announcement';
  title: string;
  description: string;
  date: string;
  isNew?: boolean;
  link?: string;
}

export const platformUpdates: PlatformUpdate[] = [
  {
    id: '1',
    type: 'feature',
    title: 'Nouveau broker partenaire : Exness',
    description:
      'Exness rejoint notre réseau de brokers partenaires avec un taux de cashback de 65% sur vos commissions.',
    date: '2024-12-18',
    isNew: true
  },
  {
    id: '2',
    type: 'improvement',
    title: 'Dashboard repensé',
    description:
      'Interface utilisateur améliorée avec de nouvelles animations et une navigation plus fluide.',
    date: '2024-12-17',
    isNew: true
  },
  {
    id: '3',
    type: 'announcement',
    title: 'Programme de parrainage bonifié',
    description:
      'Gagnez maintenant 15% du cashback de vos filleuls au lieu de 10% pendant tout le mois de décembre.',
    date: '2024-12-15',
    isNew: true
  },
  {
    id: '4',
    type: 'feature',
    title: 'Retraits instantanés en crypto',
    description:
      'Vos demandes de retrait en USDT sont maintenant traitées instantanément 24h/24.',
    date: '2024-12-12'
  },
  {
    id: '5',
    type: 'fix',
    title: 'Correction synchronisation ICMarkets',
    description:
      'Le problème de synchronisation des trades ICMarkets a été résolu.',
    date: '2024-12-10'
  },
  {
    id: '6',
    type: 'improvement',
    title: 'Statistiques détaillées par broker',
    description:
      'Visualisez maintenant vos performances et cashback broker par broker.',
    date: '2024-12-08'
  }
];
