import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { AvailableBrokers } from '@/features/brokers/components/available-brokers';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { IconArrowLeft } from '@tabler/icons-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `Dashboard : ${t('nav.partnerBrokers')}`
  };
}

export default async function AvailableBrokersPage() {
  const t = await getTranslations();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title={t('pages.brokers.available.title')}
          description={t('pages.brokers.available.description')}
        >
          <Button asChild variant='outline'>
            <Link href='/dashboard/brokers/my-brokers'>
              <IconArrowLeft className='mr-2 h-4 w-4' />
              {t('nav.myAccounts')}
            </Link>
          </Button>
        </PageHeader>
        <AvailableBrokers />
      </div>
    </PageContainer>
  );
}
