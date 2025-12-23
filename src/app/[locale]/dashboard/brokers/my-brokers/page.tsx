import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { MyBrokers } from '@/features/brokers/components/my-brokers';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { IconArrowRight } from '@tabler/icons-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `Dashboard : ${t('nav.myAccounts')}`
  };
}

export default async function MyBrokersPage() {
  const t = await getTranslations();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title={t('pages.brokers.myAccounts.title')}
          description={t('pages.brokers.myAccounts.description')}
        >
          <Button asChild variant='outline'>
            <Link href='/dashboard/brokers/available'>
              {t('common.addBroker')}
              <IconArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </PageHeader>
        <MyBrokers />
      </div>
    </PageContainer>
  );
}
