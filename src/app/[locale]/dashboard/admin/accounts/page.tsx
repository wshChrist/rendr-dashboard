import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminAccountsApprovalView } from '@/features/admin/components/admin-accounts-approval-view';

export const metadata = {
  title: 'Dashboard : Administration - Approbation des comptes'
};

export default async function AdminAccountsPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Administration'
          description='Approuvez ou rejetez les comptes de trading supplémentaires demandés par les utilisateurs.'
        />
        <AdminAccountsApprovalView />
      </div>
    </PageContainer>
  );
}
