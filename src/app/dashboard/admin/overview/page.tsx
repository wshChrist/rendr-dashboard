import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { AdminNav } from '@/features/admin/components/admin-nav';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminOverviewView } from '@/features/admin/components/admin-overview-view';

export const metadata = {
  title: 'Dashboard : Administration - Vue d’ensemble'
};

export default async function AdminOverviewPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Administration'
          description='Pilotez la plateforme: KPIs, retraits, brokers, maintenance.'
        >
          <AdminNav />
        </PageHeader>

        <AdminOverviewView />
      </div>
    </PageContainer>
  );
}

