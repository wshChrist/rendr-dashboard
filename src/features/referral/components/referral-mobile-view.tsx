'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { ReferredUser } from './referral-table-columns';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { IconCalendar, IconUsers, IconTrendingUp } from '@tabler/icons-react';

interface ReferralMobileViewProps {
  data: ReferredUser[];
  isLoading?: boolean;
}

export function ReferralMobileView({
  data,
  isLoading = false
}: ReferralMobileViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : fr;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>{t('common.loading')}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 p-8'>
        <div className='rounded-xl border border-white/5 bg-white/5 p-3'>
          <IconUsers className='text-muted-foreground h-6 w-6' />
        </div>
        <span className='text-muted-foreground text-center'>
          {t('pages.referral.noReferralsFound')}
        </span>
        <span className='text-muted-foreground/60 text-center text-sm'>
          {t('pages.referral.shareLinkToStart')}
        </span>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {data.map((user, index) => {
        const joinedDate = new Date(user.joined);
        const isActive = user.status === 'active';

        return (
          <div
            key={user.id || index}
            className={cn(
              'animate-fade-in-up rounded-xl border border-white/5 bg-zinc-900/40 p-4 opacity-0 backdrop-blur-sm transition-all duration-300 hover:border-white/8 hover:bg-zinc-900/50'
            )}
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {/* Header: User & Status */}
            <div className='mb-3 flex items-start justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5 font-semibold'>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{user.name}</p>
                  <p className='text-muted-foreground/60 truncate text-xs'>
                    {t('pages.referral.columns.referred')}
                  </p>
                </div>
              </div>
              {isActive ? (
                <RendRBadge variant='success' dot dotColor='green' size='sm'>
                  {t('pages.referral.status.active')}
                </RendRBadge>
              ) : (
                <RendRBadge variant='outline' dot dotColor='yellow' size='sm'>
                  {t('pages.referral.status.pending')}
                </RendRBadge>
              )}
            </div>

            {/* Stats en grille */}
            <div className='grid grid-cols-2 gap-3 border-t border-white/5 pt-3'>
              <div className='flex flex-col'>
                <span className='text-muted-foreground mb-1 flex items-center gap-1 text-xs'>
                  <IconCalendar className='h-3 w-3' />
                  {t('pages.referral.columns.joinDate')}
                </span>
                <span className='text-sm font-medium'>
                  {format(joinedDate, 'dd MMM yyyy', { locale: dateLocale })}
                </span>
                <span className='text-muted-foreground/60 text-xs'>
                  {format(joinedDate, 'HH:mm', { locale: dateLocale })}
                </span>
              </div>
              <div className='flex flex-col items-end'>
                <span className='text-muted-foreground mb-1 flex items-center gap-1 text-xs'>
                  <IconTrendingUp className='h-3 w-3' />
                  {t('pages.referral.columns.earnings')}
                </span>
                <span className='flex items-center gap-1 text-sm font-semibold text-[#c5d13f]'>
                  +{user.earnings.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
