import { delay } from '@/constants/mock-api';
import { RecentActivity } from '@/features/overview/components/recent-activity';

export default async function Sales() {
  await delay(3000);
  return <RecentActivity />;
}
