import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { WithdrawalsView } from '@/features/withdrawals/components/withdrawals-view';

export const metadata = {
  title: 'Dashboard : Mes Retraits'
};

export default function WithdrawalsPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Vos retraits'
          description='Récupérez votre cashback quand vous le souhaitez.'
        />
        <WithdrawalsView />
      </div>
    </PageContainer>
  );
}
