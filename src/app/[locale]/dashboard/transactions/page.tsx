import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import TransactionListing from '@/features/transactions/components/transaction-listing';
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
      <div className='relative flex flex-1 flex-col space-y-6 overflow-x-hidden'>
        {/* Section Header */}
        <section>
          <PageHeader
            title={t('pages.transactions.title')}
            description={t('pages.transactions.description')}
          />
        </section>

        {/* Main Content */}
        <section className='space-y-4'>
          <TransactionListing />
        </section>
      </div>
    </PageContainer>
  );
}
