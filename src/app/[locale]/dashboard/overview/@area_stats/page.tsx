import { delay } from '@/constants/mock-api';
import { CashbackStatsGraph } from '@/features/overview/components/cashback-stats';

export default async function AreaStats() {
  await delay(2000);
  return <CashbackStatsGraph />;
}
