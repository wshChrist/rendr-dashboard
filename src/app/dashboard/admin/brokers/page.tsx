import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { AdminNav } from '@/features/admin/components/admin-nav';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminBrokersView } from '@/features/admin/components/admin-brokers-view';

export const metadata = {
  title: 'Dashboard : Administration - Brokers'
};

export default async function AdminBrokersPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Administration'
          description='Activez/désactivez des brokers, mettez-les en maintenance, et gérez leur disponibilité.'
        >
          <AdminNav />
        </PageHeader>

        <AdminBrokersView />
      </div>
    </PageContainer>
  );
}

