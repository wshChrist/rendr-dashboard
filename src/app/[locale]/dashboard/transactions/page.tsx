import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { TransactionListing } from '@/features/transactions/components/transaction-listing';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `Dashboard : ${t('pages.transactions.title')}`
  };
}

export default async function TransactionsPage() {
  const t = await getTranslations();

  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title={t('pages.transactions.title')}
          description={t('pages.transactions.description')}
        />
        <TransactionListing />
      </div>
    </PageContainer>
  );
}
