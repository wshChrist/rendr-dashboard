import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { AdminNav } from '@/features/admin/components/admin-nav';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminWithdrawalsView } from '@/features/admin/components/admin-withdrawals-view';

export const metadata = {
  title: 'Dashboard : Administration - Retraits'
};

export default async function AdminWithdrawalsPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Administration'
          description='Validez, rejetez et suivez les demandes de retraits.'
        >
          <AdminNav />
        </PageHeader>

        <AdminWithdrawalsView />
      </div>
    </PageContainer>
  );
}

