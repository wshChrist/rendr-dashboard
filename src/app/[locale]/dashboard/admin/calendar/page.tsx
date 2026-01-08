import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminCalendarView } from '@/features/admin/components/admin-calendar-view';

export const metadata = {
  title: 'Dashboard : Administration - Calendrier'
};

export default async function AdminCalendarPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Administration'
          description="Espace de travail collaboratif pour l'équipe admin."
        />

        <AdminCalendarView />
      </div>
    </PageContainer>
  );
}
