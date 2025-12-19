import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { TransactionListing } from '@/features/transactions/components/transaction-listing';

export const metadata = {
  title: 'Dashboard : Mes Transactions'
};

export default function TransactionsPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Historique des transactions'
          description='Chaque trade vous rapporte. Voici le détail.'
        />
        <TransactionListing />
      </div>
    </PageContainer>
  );
}
