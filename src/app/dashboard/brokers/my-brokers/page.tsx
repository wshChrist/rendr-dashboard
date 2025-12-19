import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { MyBrokers } from '@/features/brokers/components/my-brokers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';

export const metadata = {
  title: 'Dashboard : Mes Comptes'
};

export default function MyBrokersPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <PageHeader
          title='Vos comptes connectés'
          description='Suivez la performance de chacun de vos comptes de trading.'
        >
          <Button asChild variant='outline'>
            <Link href='/dashboard/brokers/available'>
              Ajouter un broker
              <IconArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </PageHeader>
        <MyBrokers />
      </div>
    </PageContainer>
  );
}
