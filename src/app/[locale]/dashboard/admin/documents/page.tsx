import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminDocumentsView } from '@/features/admin/components/admin-documents-view';

export const metadata = {
  title: 'Dashboard : Administration - Documents'
};

export default async function AdminDocumentsPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Administration'
          description="Espace de travail collaboratif pour l'équipe admin."
        />

        <AdminDocumentsView />
      </div>
    </PageContainer>
  );
}
