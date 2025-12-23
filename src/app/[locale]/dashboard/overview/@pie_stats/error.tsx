'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export default function PieStatsError({ error }: { error: Error }) {
  const t = useTranslations();

  return (
    <Alert variant='destructive'>
      <IconAlertCircle className='h-4 w-4' />
      <AlertTitle>{t('pages.error.title')}</AlertTitle>
      <AlertDescription>
        {t('pages.error.statsLoadError')} : {error.message}
      </AlertDescription>
    </Alert>
  );
}
