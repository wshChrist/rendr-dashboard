import { delay } from '@/constants/mock-api';
import { BrokerDistribution } from '@/features/overview/components/broker-distribution';

export default async function Stats() {
  await delay(1000);
  return <BrokerDistribution />;
}
