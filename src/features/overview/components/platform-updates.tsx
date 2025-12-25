'use client';

import { useState } from 'react';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { RendRButton } from '@/components/ui/rendr-button';
import { PlatformUpdate } from '@/constants/updates-data';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  IconSparkles,
  IconRocket,
  IconBug,
  IconSpeakerphone,
  IconBell
} from '@tabler/icons-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ContactDialog } from './contact-dialog';
import { useGitHubUpdates } from '@/hooks/use-github-updates';
import { useTranslations } from 'next-intl';

const getUpdateIcon = (type: PlatformUpdate['type']) => {
  switch (type) {
    case 'feature':
      return <IconRocket className='h-4 w-4' />;
    case 'improvement':
      return <IconSparkles className='h-4 w-4' />;
    case 'fix':
      return <IconBug className='h-4 w-4' />;
    case 'announcement':
      return <IconSpeakerphone className='h-4 w-4' />;
    default:
      return <IconBell className='h-4 w-4' />;
  }
};

const getUpdateBadge = (type: PlatformUpdate['type'], t: any) => {
  switch (type) {
    case 'feature':
      return (
        <RendRBadge variant='accent' size='sm'>
          {t('updates.types.feature')}
        </RendRBadge>
      );
    case 'improvement':
      return (
        <RendRBadge variant='default' size='sm'>
          {t('updates.types.improvement')}
        </RendRBadge>
      );
    case 'fix':
      return (
        <RendRBadge variant='muted' size='sm'>
          {t('updates.types.fix')}
        </RendRBadge>
      );
    case 'announcement':
      return (
        <RendRBadge variant='solid' size='sm'>
          {t('updates.types.announcement')}
        </RendRBadge>
      );
    default:
      return (
        <RendRBadge variant='outline' size='sm'>
          {t('updates.types.info')}
        </RendRBadge>
      );
  }
};

export function PlatformUpdates() {
  const t = useTranslations();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const { updates: platformUpdates, isLoading } = useGitHubUpdates();

  // Afficher les 4 dernières mises à jour
  const recentUpdates = platformUpdates.slice(0, 4);
  const newUpdatesCount = platformUpdates.filter((u) => u.isNew).length;

  if (isLoading) {
    return (
      <div
        className={cn(
          'h-full rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-pulse'
        )}
      />
    );
  }

  return (
    <>
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
      />
      <div
        className={cn(
          'h-full rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50'
        )}
      >
        {/* Header */}
        <div className='mb-5 flex items-center justify-between'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconBell className='h-4 w-4' />
              </span>
              <h3 className='text-lg font-semibold'>
                {t('updates.filters.features')}
              </h3>
              {newUpdatesCount > 0 && (
                <RendRBadge
                  variant='solid'
                  size='sm'
                  className='animate-pulse-subtle'
                >
                  {newUpdatesCount}{' '}
                  {newUpdatesCount === 1
                    ? t('updates.newCount.one')
                    : t('updates.newCount.other')}
                </RendRBadge>
              )}
            </div>
            <p className='text-muted-foreground text-sm'>
              {t('updates.latestUpdates')}
            </p>
          </div>
          <Link href='/dashboard/updates'>
            <RendRButton variant='ghost' size='sm' icon='arrow'>
              {t('updates.seeAll')}
            </RendRButton>
          </Link>
        </div>

        {/* Updates list */}
        <div className='space-y-3'>
          {recentUpdates.map((update, index) => (
            <div
              key={update.id}
              className={cn(
                'group flex items-start gap-3',
                'rounded-xl p-3',
                'transition-all duration-200',
                'hover:bg-white/5',
                'animate-fade-in-up opacity-0'
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards'
              }}
            >
              {/* Icône */}
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center',
                  'rounded-xl border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'group-hover:border-white/10 group-hover:bg-white/10'
                )}
              >
                {getUpdateIcon(update.type)}
              </div>

              {/* Contenu */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h4 className='text-sm leading-none font-medium'>
                      {update.title}
                    </h4>
                    {update.isNew && (
                      <RendRBadge
                        variant='accent'
                        size='sm'
                        dot
                        dotColor='green'
                      >
                        {t('updates.new')}
                      </RendRBadge>
                    )}
                  </div>
                  {getUpdateBadge(update.type, t)}
                </div>
                <p className='text-muted-foreground mt-1.5 line-clamp-2 text-xs'>
                  {update.description}
                </p>
                <p className='text-muted-foreground/60 mt-2 text-[11px]'>
                  {formatDistanceToNow(new Date(update.date), {
                    addSuffix: true,
                    locale: fr
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className='mt-5 border-t border-white/5 pt-4'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>
              {t('updates.contact.haveSuggestion')}
            </span>
            <button
              onClick={() => setContactDialogOpen(true)}
              className='text-foreground flex cursor-pointer items-center gap-1 transition-colors hover:text-white'
            >
              {t('updates.contact.contactUs')}
              <IconSparkles className='h-3 w-3' />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
