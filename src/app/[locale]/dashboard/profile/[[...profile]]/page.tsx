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
      <div className='space-y-6'>
        <PageHeader
          title={t('pages.profile.title')}
          description={t('pages.profile.description')}
        />
        <ProfileViewPage />
      </div>
    </PageContainer>
  );
}
