import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminUsersView } from '@/features/admin/components/admin-users-view';

export const metadata = {
  title: 'Dashboard : Administration - Gestion des utilisateurs'
};

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Administration'
          description='Gérez les comptes utilisateurs, leurs brokers et leurs balances de cashback.'
        />
        <AdminUsersView />
      </div>
    </PageContainer>
  );
}
