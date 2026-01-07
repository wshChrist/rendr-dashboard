import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import ProfileViewPage from '@/features/profile/components/profile-view-page';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `Dashboard : ${t('nav.profile')}`
  };
}

export default async function Page() {
  const t = await getTranslations();

  return (
    <PageContainer>
      <div className='relative flex flex-1 flex-col space-y-6 overflow-x-hidden'>
        {/* Section Header */}
        <section>
          <PageHeader
            title={t('pages.profile.title')}
            description={t('pages.profile.description')}
          />
        </section>

        {/* Main Content */}
        <section className='space-y-4'>
          <ProfileViewPage />
        </section>
      </div>
    </PageContainer>
  );
}
