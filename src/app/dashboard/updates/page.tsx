import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { AllUpdates } from '@/features/updates/components/all-updates';

export const metadata = {
  title: 'Dashboard : Nouveautés'
};

export default function UpdatesPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Quoi de neuf ?'
          description='On bosse dur pour vous. Voici nos dernières améliorations.'
        />
        <AllUpdates />
      </div>
    </PageContainer>
  );
}
