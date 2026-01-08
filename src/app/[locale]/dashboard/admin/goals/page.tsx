import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminGoalsView } from '@/features/admin/components/admin-goals-view';

export const metadata = {
  title: 'Dashboard : Administration - Objectifs'
};

export default async function AdminGoalsPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Administration'
          description="Espace de travail collaboratif pour l'équipe admin."
        />

        <AdminGoalsView />
      </div>
    </PageContainer>
  );
}
