'use client';

import dynamic from 'next/dynamic';

const StatsCards = dynamic(
  () => import('./stats-cards').then((mod) => mod.StatsCards),
  { ssr: false }
);

export default StatsCards;
