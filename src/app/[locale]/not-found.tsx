'use client';

import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className='absolute top-1/2 left-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center'>
      <span className='from-foreground bg-linear-to-b to-transparent bg-clip-text text-[10rem] leading-none font-extrabold text-transparent'>
        404
      </span>
      <h2 className='font-heading my-2 text-2xl font-bold'>
        {t('common.somethingMissing')}
      </h2>
      <p>{t('common.pageNotFound')}</p>
      <div className='mt-8 flex justify-center gap-2'>
        <Button onClick={() => router.back()} variant='default' size='lg'>
          {t('common.goBack')}
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
          variant='ghost'
          size='lg'
        >
          {t('common.backToHome')}
        </Button>
      </div>
    </div>
  );
}
