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

export default function WorkspacesPage() {
  const t = useTranslations();
  // Note: Supabase doesn't have built-in organizations like Clerk
  // This page is simplified to work without Clerk

  return (
    <PageContainer
      pageTitle={t('pages.workspaces.title')}
      pageDescription={t('pages.workspaces.description')}
    >
      <div className='space-y-6'>
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            {t('pages.workspaces.info')}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>{t('pages.workspaces.title')}</CardTitle>
            <CardDescription>{t('pages.workspaces.createAndManage')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-center'>
              {t('pages.workspaces.comingSoon')}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
