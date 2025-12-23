import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { AvailableBrokers } from '@/features/brokers/components/available-brokers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';

export const metadata = {
  title: 'Dashboard : Brokers Partenaires'
};

export default function AvailableBrokersPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Nos brokers partenaires'
          description='Connectez votre compte et commencez à gagner du cashback immédiatement.'
        >
          <Button asChild variant='outline'>
            <Link href='/dashboard/brokers/my-brokers'>
              <IconArrowLeft className='mr-2 h-4 w-4' />
              Mes comptes
            </Link>
          </Button>
        </PageHeader>
        <AvailableBrokers />
      </div>
    </PageContainer>
  );
}
