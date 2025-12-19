import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { ReferralView } from '@/features/referral/components/referral-view';

export const metadata = {
  title: 'Dashboard : Parrainage'
};

export default function ReferralPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Parrainez, gagnez plus'
          description='Invitez vos amis traders et recevez un bonus sur chacun de leurs trades.'
        />
        <ReferralView />
      </div>
    </PageContainer>
  );
}
