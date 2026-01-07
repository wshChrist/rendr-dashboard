'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function BillingPage() {
  const t = useTranslations();
  // Note: Supabase doesn't have built-in organizations or billing
  // This page is simplified to work without Clerk

  return (
    <PageContainer>
      <div className='relative flex flex-1 flex-col space-y-6 overflow-x-hidden'>
        {/* Section Header */}
        <section>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              {t('pages.billing.title')}
            </h1>
            <p className='text-muted-foreground'>
              {t('pages.billing.description')}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className='space-y-4'>
          {/* Info Alert */}
          <Alert>
            <Info className='h-4 w-4' />
            <AlertDescription>{t('pages.billing.info')}</AlertDescription>
          </Alert>

          {/* Placeholder for billing */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.billing.availablePlans')}</CardTitle>
              <CardDescription>{t('pages.billing.choosePlan')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mx-auto max-w-4xl'>
                <p className='text-muted-foreground text-center'>
                  {t('pages.billing.comingSoon')}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageContainer>
  );
}
