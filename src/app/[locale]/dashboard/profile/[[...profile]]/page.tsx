import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata = {
  title: 'Dashboard : Mon Profil'
};

export default async function Page() {
  return (
    <PageContainer>
      <div className='space-y-6'>
        <PageHeader
          title='Votre espace personnel'
          description='Gérez votre compte, vos préférences et vos méthodes de paiement.'
        />
        <ProfileViewPage />
      </div>
    </PageContainer>
  );
}
