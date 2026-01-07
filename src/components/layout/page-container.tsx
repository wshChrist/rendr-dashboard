'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heading } from '../ui/heading';
import { useTranslations } from 'next-intl';

function PageSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4 p-3 sm:p-4 md:px-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='bg-muted mb-2 h-7 w-32 rounded sm:h-8 sm:w-48' />
          <div className='bg-muted h-3 w-64 rounded sm:h-4 sm:w-96' />
        </div>
      </div>
      <div className='bg-muted mt-4 h-32 w-full rounded-lg sm:mt-6 sm:h-40' />
      <div className='bg-muted h-32 w-full rounded-lg sm:h-40' />
    </div>
  );
}

export default function PageContainer({
  children,
  scrollable = true,
  isloading = false,
  access = true,
  accessFallback,
  pageTitle,
  pageDescription,
  pageHeaderAction
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  isloading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  pageHeaderAction?: React.ReactNode;
}) {
  const t = useTranslations();

  if (!access) {
    return (
      <div className='flex flex-1 items-center justify-center p-3 sm:p-4 md:px-6'>
        {accessFallback ?? (
          <div className='text-muted-foreground text-center text-base sm:text-lg'>
            {t('access.noAccess')}
          </div>
        )}
      </div>
    );
  }

  const content = isloading ? <PageSkeleton /> : children;

  return scrollable ? (
    <ScrollArea className='h-[calc(100dvh-52px)] overflow-x-hidden'>
      <div className='flex flex-1 flex-col p-3 sm:p-4 md:px-6'>
        <div className='mx-auto w-full max-w-7xl'>
          <div className='mb-3 flex min-w-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <Heading
                title={pageTitle ?? ''}
                description={pageDescription ?? ''}
              />
            </div>
            {pageHeaderAction ? (
              <div className='flex-shrink-0'>{pageHeaderAction}</div>
            ) : null}
          </div>
          <div className='overflow-x-hidden'>{content}</div>
        </div>
      </div>
    </ScrollArea>
  ) : (
    <div className='flex flex-1 flex-col p-3 sm:p-4 md:px-6'>
      <div className='mx-auto w-full max-w-7xl'>
        <div className='mb-3 flex min-w-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0 flex-1'>
            <Heading
              title={pageTitle ?? ''}
              description={pageDescription ?? ''}
            />
          </div>
          {pageHeaderAction ? (
            <div className='flex-shrink-0'>{pageHeaderAction}</div>
          ) : null}
        </div>
        <div className='overflow-x-hidden'>{content}</div>
      </div>
    </div>
  );
}
