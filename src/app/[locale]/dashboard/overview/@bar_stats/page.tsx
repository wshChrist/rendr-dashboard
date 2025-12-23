import { delay } from '@/constants/mock-api';
import { VolumeChart } from '@/features/overview/components/volume-chart';

export default async function BarStats() {
  await delay(1000);

  return <VolumeChart />;
}
