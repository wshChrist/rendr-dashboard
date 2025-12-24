'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ExclusivePage() {
  const t = useTranslations();
  // Note: Supabase doesn't have built-in plan protection like Clerk
  // This page is simplified to work without Clerk plans
  // You can implement custom plan checks using user metadata or database queries

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div>
          <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
            <BadgeCheck className='text-foreground h-7 w-7' />
            Exclusive Area
          </h1>
          <p className='text-muted-foreground'>
            Welcome! This page contains exclusive features.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Thank You for Checking Out the Exclusive Page</CardTitle>
            <CardDescription>
              This page can be protected with custom plan checks using Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-lg'>{t('pages.exclusive.message')}</div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
