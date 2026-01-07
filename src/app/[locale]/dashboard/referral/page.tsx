import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { ReferralView } from '@/features/referral/components/referral-view';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `Dashboard : ${t('pages.referral.title')}`
  };
}

export default async function ReferralPage() {
  const t = await getTranslations();

  return (
    <PageContainer>
      <div className='relative flex flex-1 flex-col space-y-6 overflow-x-hidden'>
        {/* Section Header */}
        <section>
          <PageHeader
            title={t('pages.referral.title')}
            description={t('pages.referral.description')}
          />
        </section>

        {/* Main Content */}
        <section className='space-y-4'>
          <ReferralView />
        </section>
      </div>
    </PageContainer>
  );
}
