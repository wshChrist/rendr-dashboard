'use client';

import { Button } from '@/components/ui/button';
import { platformUpdates, PlatformUpdate } from '@/constants/updates-data';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  IconSparkles,
  IconRocket,
  IconBug,
  IconSpeakerphone,
  IconBell,
  IconFilter,
  IconCalendar,
  IconTrendingUp,
  IconCheck,
  IconArrowRight,
  IconExternalLink
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';
import { ContactDialog } from '@/features/overview/components/contact-dialog';

const getUpdateIcon = (type: PlatformUpdate['type']) => {
  const iconClass = 'h-5 w-5';
  switch (type) {
    case 'feature':
      return <IconRocket className={iconClass} />;
    case 'improvement':
      return <IconSparkles className={iconClass} />;
    case 'fix':
      return <IconBug className={iconClass} />;
    case 'announcement':
      return <IconSpeakerphone className={iconClass} />;
    default:
      return <IconBell className={iconClass} />;
  }
};

const getUpdateTypeLabel = (type: PlatformUpdate['type']) => {
  switch (type) {
    case 'feature':
      return 'Nouveauté';
    case 'improvement':
      return 'Amélioration';
    case 'fix':
      return 'Correction';
    case 'announcement':
      return 'Annonce';
    default:
      return 'Info';
  }
};

const getUpdateBadgeVariant = (
  type: PlatformUpdate['type']
): 'default' | 'accent' | 'outline' | 'muted' => {
  switch (type) {
    case 'feature':
      return 'accent';
    case 'improvement':
      return 'default';
    case 'fix':
      return 'muted';
    case 'announcement':
      return 'accent';
    default:
      return 'outline';
  }
};

const getUpdateIconColor = (type: PlatformUpdate['type']) => {
  switch (type) {
    case 'feature':
      return 'text-[#c5d13f]';
    case 'improvement':
      return 'text-blue-400';
    case 'fix':
      return 'text-purple-400';
    case 'announcement':
      return 'text-orange-400';
    default:
      return 'text-muted-foreground';
  }
};

type FilterType = 'all' | PlatformUpdate['type'];

export function AllUpdates() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const filteredUpdates =
    filter === 'all'
      ? platformUpdates
      : platformUpdates.filter((u) => u.type === filter);

  // Calcul des stats
  const stats = useMemo(() => {
    const totalUpdates = platformUpdates.length;
    const newUpdates = platformUpdates.filter((u) => u.isNew).length;
    const features = platformUpdates.filter((u) => u.type === 'feature').length;
    const improvements = platformUpdates.filter(
      (u) => u.type === 'improvement'
    ).length;
    const latestUpdate = platformUpdates[0];

    return {
      totalUpdates,
      newUpdates,
      features,
      improvements,
      latestUpdate
    };
  }, []);

  const filterButtons: {
    type: FilterType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: 'all', label: 'Tout', icon: <IconBell className='h-4 w-4' /> },
    {
      type: 'feature',
      label: 'Nouveautés',
      icon: <IconRocket className='h-4 w-4' />
    },
    {
      type: 'improvement',
      label: 'Améliorations',
      icon: <IconSparkles className='h-4 w-4' />
    },
    {
      type: 'announcement',
      label: 'Annonces',
      icon: <IconSpeakerphone className='h-4 w-4' />
    },
    { type: 'fix', label: 'Corrections', icon: <IconBug className='h-4 w-4' /> }
  ];

  return (
    <>
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
      />
      <div className='space-y-6'>
        {/* Stats Cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Total Updates */}
          <div
            className={cn(
              'rounded-2xl p-5',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'transition-all duration-300',
              'hover:border-white/8 hover:bg-zinc-900/50',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationFillMode: 'forwards' }}
          >
            <div className='mb-3 flex items-center gap-3'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconBell className='h-5 w-5' />
              </div>
              <span className='text-muted-foreground text-sm'>Total</span>
            </div>
            <p className='stat-number text-3xl font-bold'>
              {stats.totalUpdates}
            </p>
            <p className='text-muted-foreground/60 mt-1 text-sm'>
              mises à jour
            </p>
          </div>

          {/* Nouvelles */}
          <div
            className={cn(
              'rounded-2xl p-5',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-[#c5d13f]/20',
              'transition-all duration-300',
              'hover:border-[#c5d13f]/40',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-3 flex items-center gap-3'>
              <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
                <IconRocket className='h-5 w-5 text-[#c5d13f]' />
              </div>
              <span className='text-muted-foreground text-sm'>Nouvelles</span>
            </div>
            <p className='stat-number text-3xl font-bold text-[#c5d13f]'>
              {stats.newUpdates}
            </p>
            <p className='text-muted-foreground/60 mt-1 text-sm'>
              récemment ajoutées
            </p>
          </div>

          {/* Features */}
          <div
            className={cn(
              'rounded-2xl p-5',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'transition-all duration-300',
              'hover:border-white/8 hover:bg-zinc-900/50',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-3 flex items-center gap-3'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconSparkles className='h-5 w-5' />
              </div>
              <span className='text-muted-foreground text-sm'>
                Fonctionnalités
              </span>
            </div>
            <p className='stat-number text-3xl font-bold'>{stats.features}</p>
            <p className='text-muted-foreground/60 mt-1 text-sm'>
              nouvelles features
            </p>
          </div>

          {/* Dernière mise à jour */}
          <div
            className={cn(
              'rounded-2xl p-5',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'transition-all duration-300',
              'hover:border-white/8 hover:bg-zinc-900/50',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-3 flex items-center gap-3'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconCalendar className='h-5 w-5' />
              </div>
              <span className='text-muted-foreground text-sm'>Dernière</span>
            </div>
            <p className='line-clamp-1 text-sm font-semibold'>
              {stats.latestUpdate?.title}
            </p>
            <p className='text-muted-foreground/60 mt-1 text-xs'>
              {stats.latestUpdate &&
                formatDistanceToNow(new Date(stats.latestUpdate.date), {
                  addSuffix: true,
                  locale: fr
                })}
            </p>
          </div>
        </div>

        {/* Filtres stylisés */}
        <div
          className={cn(
            'rounded-2xl p-4',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-4 flex items-center gap-2'>
            <IconFilter className='text-muted-foreground h-4 w-4' />
            <span className='text-sm font-medium'>Filtres</span>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {filterButtons.map((btn) => (
              <Button
                key={btn.type}
                variant={filter === btn.type ? 'default' : 'outline'}
                size='sm'
                onClick={() => setFilter(btn.type)}
                className={cn(
                  'transition-all duration-200',
                  filter === btn.type
                    ? 'border-white/20 bg-white/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                )}
              >
                {btn.icon}
                <span className='ml-2'>{btn.label}</span>
                {filter === btn.type && <IconCheck className='ml-2 h-3 w-3' />}
              </Button>
            ))}
          </div>
        </div>

        {/* Liste des mises à jour - Layout amélioré */}
        <div className='space-y-4'>
          {filteredUpdates.map((update, index) => {
            const isRecent = update.isNew;
            const daysAgo = formatDistanceToNow(new Date(update.date), {
              addSuffix: true,
              locale: fr
            });

            return (
              <div
                key={update.id}
                className={cn(
                  'group relative overflow-hidden rounded-2xl p-6',
                  'bg-zinc-900/40 backdrop-blur-sm',
                  'border transition-all duration-300',
                  isRecent
                    ? 'border-[#c5d13f]/20 hover:border-[#c5d13f]/40'
                    : 'border-white/5 hover:border-white/10',
                  'hover:bg-zinc-900/50',
                  'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
                  'animate-fade-in-up opacity-0'
                )}
                style={{
                  animationDelay: `${250 + index * 80}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className='flex gap-5'>
                  {/* Icône avec style */}
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
                      'border border-white/5 bg-white/5',
                      'transition-all duration-300',
                      'group-hover:scale-110 group-hover:bg-white/10',
                      getUpdateIconColor(update.type)
                    )}
                  >
                    {getUpdateIcon(update.type)}
                  </div>

                  {/* Contenu principal */}
                  <div className='min-w-0 flex-1 space-y-3'>
                    {/* Header */}
                    <div className='flex items-start justify-between gap-4'>
                      <div className='min-w-0 flex-1'>
                        <div className='mb-2 flex flex-wrap items-center gap-2'>
                          <h3 className='text-lg font-semibold'>
                            {update.title}
                          </h3>
                          {isRecent && (
                            <RendRBadge
                              variant='accent'
                              size='sm'
                              dot
                              dotColor='green'
                            >
                              NOUVEAU
                            </RendRBadge>
                          )}
                        </div>
                        <p className='text-muted-foreground text-sm leading-relaxed'>
                          {update.description}
                        </p>
                      </div>

                      {/* Badge type et date */}
                      <div className='flex shrink-0 flex-col items-end gap-2'>
                        <RendRBadge
                          variant={getUpdateBadgeVariant(update.type)}
                        >
                          {getUpdateTypeLabel(update.type)}
                        </RendRBadge>
                        <div className='text-muted-foreground/60 flex items-center gap-1 text-xs whitespace-nowrap'>
                          <IconCalendar className='h-3 w-3' />
                          <span>
                            {format(new Date(update.date), 'dd MMM yyyy', {
                              locale: fr
                            })}
                          </span>
                        </div>
                        <span className='text-muted-foreground/40 text-xs whitespace-nowrap'>
                          {daysAgo}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {update.link && (
                      <div className='flex items-center gap-2 border-t border-white/5 pt-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-[#c5d13f] hover:bg-[#c5d13f]/10 hover:text-[#c5d13f]'
                          asChild
                        >
                          <a
                            href={update.link}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            En savoir plus
                            <IconArrowRight className='ml-2 h-4 w-4' />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message si aucun résultat */}
        {filteredUpdates.length === 0 && (
          <div
            className={cn(
              'rounded-2xl p-12',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationFillMode: 'forwards' }}
          >
            <div className='flex flex-col items-center justify-center'>
              <div className='mb-4 rounded-2xl border border-white/5 bg-white/5 p-4'>
                <IconBell className='text-muted-foreground h-10 w-10' />
              </div>
              <h3 className='mb-2 text-lg font-semibold'>Aucune mise à jour</h3>
              <p className='text-muted-foreground max-w-md text-center'>
                Aucune mise à jour ne correspond à ce filtre. Essayez un autre
                filtre ou revenez plus tard.
              </p>
            </div>
          </div>
        )}

        {/* Section feedback améliorée */}
        <div
          className={cn(
            'rounded-2xl p-6 md:p-8',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-[#c5d13f]/20',
            'transition-all duration-300',
            'hover:border-[#c5d13f]/40',
            'animate-fade-in-up opacity-0'
          )}
          style={{
            animationDelay: `${250 + filteredUpdates.length * 80 + 100}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <div className='flex flex-col items-start justify-between gap-6 md:flex-row md:items-center'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
                  <IconSpeakerphone className='h-5 w-5 text-[#c5d13f]' />
                </div>
                <h3 className='text-lg font-semibold'>
                  Vous avez une idée d'amélioration ?
                </h3>
              </div>
              <p className='text-muted-foreground max-w-md text-sm'>
                Nous adorons recevoir vos suggestions pour améliorer RendR.
                Partagez vos idées et aidez-nous à construire une meilleure
                plateforme.
              </p>
            </div>
            <Button
              onClick={() => setContactDialogOpen(true)}
              className='border border-[#c5d13f]/20 bg-[#c5d13f]/10 text-[#c5d13f] hover:border-[#c5d13f]/30 hover:bg-[#c5d13f]/20'
            >
              <IconSpeakerphone className='mr-2 h-4 w-4' />
              Envoyer une suggestion
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
