import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { WithdrawalsView } from '@/features/withdrawals/components/withdrawals-view';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `Dashboard : ${t('pages.withdrawals.title')}`
  };
}

export default async function WithdrawalsPage() {
  const t = await getTranslations();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title={t('pages.withdrawals.title')}
          description={t('pages.withdrawals.description')}
        />
        <WithdrawalsView />
      </div>
    </PageContainer>
  );
}
