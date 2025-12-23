import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { AllUpdates } from '@/features/updates/components/all-updates';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `Dashboard : ${t('pages.updates.title')}`
  };
}

export default async function UpdatesPage() {
  const t = await getTranslations();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title={t('pages.updates.title')}
          description={t('pages.updates.description')}
        />
        <AllUpdates />
      </div>
    </PageContainer>
  );
}
