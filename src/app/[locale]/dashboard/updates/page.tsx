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
      <div className='relative flex flex-1 flex-col space-y-6 overflow-x-hidden'>
        {/* Section Header */}
        <section>
          <PageHeader
            title={t('pages.updates.title')}
            description={t('pages.updates.description')}
          />
        </section>

        {/* Main Content */}
        <section className='space-y-4'>
          <AllUpdates />
        </section>
      </div>
    </PageContainer>
  );
}
