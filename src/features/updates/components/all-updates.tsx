'use client';

import { Button } from '@/components/ui/button';
import { PlatformUpdate } from '@/constants/updates-data';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
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
  IconExternalLink,
  IconSearch,
  IconX,
  IconInfoCircle,
  IconShare,
  IconBookmark,
  IconClock,
  IconStar
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';
import { ContactDialog } from '@/features/overview/components/contact-dialog';
import { useGitHubUpdates } from '@/hooks/use-github-updates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

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

const getUpdateTypeLabel = (type: PlatformUpdate['type'], t: any) => {
  switch (type) {
    case 'feature':
      return t('updates.types.feature');
    case 'improvement':
      return t('updates.types.improvement');
    case 'fix':
      return t('updates.types.fix');
    case 'announcement':
      return t('updates.types.announcement');
    default:
      return t('updates.types.info');
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
  const t = useTranslations();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { updates: platformUpdates, isLoading } = useGitHubUpdates();

  const filteredUpdates = useMemo(() => {
    let result = platformUpdates;

    // Filtre par type
    if (filter !== 'all') {
      result = result.filter((u) => u.type === filter);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.title.toLowerCase().includes(query) ||
          u.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [platformUpdates, filter, searchQuery]);

  // Calcul des stats
  const stats = useMemo(() => {
    const totalUpdates = platformUpdates.length;
    const newUpdates = platformUpdates.filter((u) => u.isNew).length;
    const features = platformUpdates.filter((u) => u.type === 'feature').length;
    const improvements = platformUpdates.filter(
      (u) => u.type === 'improvement'
    ).length;
    const latestUpdate = platformUpdates[0];
    const completionRate =
      totalUpdates > 0 ? (newUpdates / totalUpdates) * 100 : 0;

    return {
      totalUpdates,
      newUpdates,
      features,
      improvements,
      latestUpdate,
      completionRate
    };
  }, [platformUpdates]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-20 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filterButtons: {
    type: FilterType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: 'all',
      label: t('updates.filters.all'),
      icon: <IconBell className='h-4 w-4' />
    },
    {
      type: 'feature',
      label: t('updates.filters.features'),
      icon: <IconRocket className='h-4 w-4' />
    },
    {
      type: 'improvement',
      label: t('updates.filters.improvements'),
      icon: <IconSparkles className='h-4 w-4' />
    },
    {
      type: 'announcement',
      label: t('updates.filters.announcements'),
      icon: <IconSpeakerphone className='h-4 w-4' />
    },
    {
      type: 'fix',
      label: t('updates.filters.fixes'),
      icon: <IconBug className='h-4 w-4' />
    }
  ];

  return (
    <>
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
      />
      <div className='space-y-6'>
        {/* Alert pour nouvelles mises à jour */}
        {stats.newUpdates > 0 && (
          <Alert
            className={cn(
              'rounded-2xl border-[#c5d13f]/20 bg-[#c5d13f]/5',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationFillMode: 'forwards' }}
          >
            <IconBell className='h-4 w-4 text-[#c5d13f]' />
            <AlertTitle className='text-[#c5d13f]'>
              {stats.newUpdates} {t('updates.stats.new')}{' '}
              {t('updates.stats.updates')}
            </AlertTitle>
            <AlertDescription>
              {t('updates.newUpdatesAvailable')}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards avec Progress */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Total Updates */}
          <Card
            className={cn(
              'transition-all duration-300',
              'hover:border-white/8 hover:bg-zinc-900/50',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationFillMode: 'forwards' }}
          >
            <CardHeader className='pb-3'>
              <div className='mb-3 flex items-center gap-3'>
                <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                  <IconBell className='h-5 w-5' />
                </div>
                <CardDescription className='mb-0'>
                  {t('updates.stats.total')}
                </CardDescription>
              </div>
              <CardTitle className='text-3xl font-bold'>
                {stats.totalUpdates}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={100} className='h-1.5 bg-white/5' />
              <p className='text-muted-foreground/60 mt-2 text-xs'>
                {t('updates.stats.updates')}
              </p>
            </CardContent>
          </Card>

          {/* Nouvelles */}
          <Card
            className={cn(
              'border-[#c5d13f]/20 bg-[#c5d13f]/5',
              'transition-all duration-300',
              'hover:border-[#c5d13f]/40',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}
          >
            <CardHeader className='pb-3'>
              <div className='mb-3 flex items-center gap-3'>
                <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
                  <IconRocket className='h-5 w-5 text-[#c5d13f]' />
                </div>
                <CardDescription className='mb-0'>
                  {t('updates.stats.new')}
                </CardDescription>
              </div>
              <CardTitle className='text-3xl font-bold text-[#c5d13f]'>
                {stats.newUpdates}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress
                value={stats.completionRate || 0}
                className='h-1.5 bg-[#c5d13f]/20'
              />
              <p className='text-muted-foreground/60 mt-2 text-xs'>
                {t('updates.stats.recentlyAdded')}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <Card
            className={cn(
              'transition-all duration-300',
              'hover:border-white/8 hover:bg-zinc-900/50',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
          >
            <CardHeader className='pb-3'>
              <div className='mb-3 flex items-center gap-3'>
                <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                  <IconSparkles className='h-5 w-5' />
                </div>
                <CardDescription className='mb-0'>
                  {t('updates.filters.features')}
                </CardDescription>
              </div>
              <CardTitle className='text-3xl font-bold'>
                {stats.features}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress
                value={
                  stats.totalUpdates > 0
                    ? Math.round((stats.features / stats.totalUpdates) * 100)
                    : 0
                }
                className='h-1.5 bg-white/5'
              />
              <p className='text-muted-foreground/60 mt-2 text-xs'>
                {t('updates.stats.newFeatures')}
              </p>
            </CardContent>
          </Card>

          {/* Dernière mise à jour avec HoverCard */}
          <Card
            className={cn(
              'transition-all duration-300',
              'hover:border-white/8 hover:bg-zinc-900/50',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
          >
            <CardHeader className='pb-3'>
              <div className='mb-3 flex items-center gap-3'>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button className='rounded-xl border border-white/5 bg-white/5 p-2 transition-colors hover:bg-white/10'>
                      <IconCalendar className='h-5 w-5' />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className={cn(
                      'rounded-xl border-white/5 bg-zinc-900/95 backdrop-blur-sm'
                    )}
                  >
                    <div className='space-y-2'>
                      <p className='text-sm font-semibold'>
                        {stats.latestUpdate?.title}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {stats.latestUpdate &&
                          format(
                            new Date(stats.latestUpdate.date),
                            'dd MMM yyyy',
                            {
                              locale: fr
                            }
                          )}
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <CardDescription className='mb-0'>
                  {t('updates.stats.last')}
                </CardDescription>
              </div>
              <CardTitle className='line-clamp-1 text-sm font-semibold'>
                {stats.latestUpdate?.title || t('updates.noUpdates')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground/60 text-xs'>
                {stats.latestUpdate &&
                  formatDistanceToNow(new Date(stats.latestUpdate.date), {
                    addSuffix: true,
                    locale: fr
                  })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section Filtres et Recherche avec Tabs */}
        <Card
          className={cn('animate-fade-in-up opacity-0')}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <IconFilter className='text-muted-foreground h-4 w-4' />
                <CardTitle className='text-base'>
                  {t('common.filters')}
                </CardTitle>
              </div>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant='outline' size='sm' className='gap-2'>
                    <IconSearch className='h-4 w-4' />
                    {t('common.search')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className={cn(
                    'w-80 rounded-xl border-white/5 bg-zinc-900/95 p-0 backdrop-blur-sm'
                  )}
                  align='end'
                >
                  <Command>
                    <CommandInput
                      placeholder={t('updates.searchPlaceholder')}
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>{t('updates.noResults')}</CommandEmpty>
                      {searchQuery && (
                        <CommandGroup heading={t('updates.searchResults')}>
                          {filteredUpdates.slice(0, 5).map((update) => (
                            <CommandItem
                              key={update.id}
                              onSelect={() => {
                                setSearchQuery(update.title);
                                setSearchOpen(false);
                              }}
                              className='cursor-pointer'
                            >
                              {getUpdateIcon(update.type)}
                              <span className='ml-2'>{update.title}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as FilterType)}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-5 bg-white/5'>
                {filterButtons.map((btn) => (
                  <TabsTrigger
                    key={btn.type}
                    value={btn.type}
                    className='data-[state=active]:text-foreground data-[state=active]:bg-white/10'
                  >
                    <div className='flex items-center gap-2'>
                      {btn.icon}
                      <span className='hidden sm:inline'>{btn.label}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {searchQuery && (
              <div className='mt-4 flex items-center gap-2'>
                <Separator className='flex-1' />
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSearchQuery('')}
                  className='gap-2'
                >
                  <IconX className='h-4 w-4' />
                  {t('common.clear')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des mises à jour avec Accordion et ScrollArea */}
        <Card
          className={cn('animate-fade-in-up opacity-0')}
          style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
        >
          <CardHeader>
            <CardTitle>
              {filteredUpdates.length} {t('updates.results')}
            </CardTitle>
            <CardDescription>
              {filter === 'all'
                ? t('updates.allUpdates')
                : t('updates.filteredBy', {
                    type: getUpdateTypeLabel(filter, t)
                  })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUpdates.length > 0 ? (
              <ScrollArea className='h-[600px] pr-4'>
                <Accordion
                  type='multiple'
                  className='space-y-4'
                  defaultValue={filteredUpdates
                    .filter((u) => u.isNew)
                    .slice(0, 3)
                    .map((u) => u.id)}
                >
                  {filteredUpdates.map((update, index) => {
                    const isRecent = update.isNew;
                    const daysAgo = formatDistanceToNow(new Date(update.date), {
                      addSuffix: true,
                      locale: fr
                    });

                    return (
                      <AccordionItem
                        key={update.id}
                        value={update.id}
                        className={cn(
                          'group relative overflow-hidden rounded-2xl border p-0',
                          isRecent ? 'border-[#c5d13f]/20' : 'border-white/5',
                          'transition-all duration-300',
                          'hover:border-white/10 hover:bg-zinc-900/30',
                          'data-[state=open]:border-white/10 data-[state=open]:bg-zinc-900/40'
                        )}
                      >
                        <AccordionTrigger className='px-6 py-4 hover:no-underline'>
                          <div className='flex w-full items-start gap-5'>
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
                            <div className='min-w-0 flex-1 text-left'>
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
                                    {t('updates.new')}
                                  </RendRBadge>
                                )}
                                <RendRBadge
                                  variant={getUpdateBadgeVariant(update.type)}
                                  size='sm'
                                >
                                  {getUpdateTypeLabel(update.type, t)}
                                </RendRBadge>
                              </div>
                              <p className='text-muted-foreground line-clamp-2 text-sm leading-relaxed'>
                                {update.description}
                              </p>
                              <div className='text-muted-foreground/60 mt-2 flex items-center gap-4 text-xs'>
                                <div className='flex items-center gap-1'>
                                  <IconCalendar className='h-3 w-3' />
                                  <span>
                                    {format(
                                      new Date(update.date),
                                      'dd MMM yyyy',
                                      {
                                        locale: fr
                                      }
                                    )}
                                  </span>
                                </div>
                                <div className='flex items-center gap-1'>
                                  <IconClock className='h-3 w-3' />
                                  <span>{daysAgo}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions avec Tooltip */}
                            <div className='flex shrink-0 items-center gap-2'>
                              {update.link && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        className='h-8 w-8 p-0'
                                        asChild
                                      >
                                        <a
                                          href={update.link}
                                          target='_blank'
                                          rel='noopener noreferrer'
                                        >
                                          <IconExternalLink className='h-4 w-4' />
                                        </a>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t('updates.learnMore')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      className='h-8 w-8 p-0'
                                    >
                                      <IconInfoCircle className='h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t('updates.moreInfo')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className='px-6 pb-4'>
                          <Separator className='mb-4' />
                          <div className='space-y-4'>
                            <div>
                              <h4 className='mb-2 text-sm font-semibold'>
                                {t('updates.details')}
                              </h4>
                              <p className='text-muted-foreground text-sm leading-relaxed'>
                                {update.description}
                              </p>
                            </div>
                            {update.link && (
                              <div className='flex items-center gap-2'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='gap-2'
                                  asChild
                                >
                                  <a
                                    href={update.link}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    {t('updates.learnMore')}
                                    <IconArrowRight className='h-4 w-4' />
                                  </a>
                                </Button>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant='outline'
                                        size='sm'
                                        className='h-9 w-9 p-0'
                                      >
                                        <IconShare className='h-4 w-4' />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t('updates.share')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </ScrollArea>
            ) : (
              <div className='flex flex-col items-center justify-center py-12'>
                <div className='mb-4 rounded-2xl border border-white/5 bg-white/5 p-4'>
                  <IconBell className='text-muted-foreground h-10 w-10' />
                </div>
                <h3 className='mb-2 text-lg font-semibold'>
                  {t('updates.noUpdates')}
                </h3>
                <p className='text-muted-foreground max-w-md text-center text-sm'>
                  {t('updates.noUpdatesFilter')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section feedback améliorée */}
        <Card
          className={cn(
            'border-[#c5d13f]/20 bg-[#c5d13f]/5',
            'transition-all duration-300',
            'hover:border-[#c5d13f]/40',
            'animate-fade-in-up opacity-0'
          )}
          style={{
            animationDelay: `${250 + filteredUpdates.length * 80 + 100}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <CardContent className='pt-6'>
            <div className='flex flex-col items-start justify-between gap-6 md:flex-row md:items-center'>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
                    <IconSpeakerphone className='h-5 w-5 text-[#c5d13f]' />
                  </div>
                  <CardTitle className='text-lg'>
                    {t('updates.feedback.title')}
                  </CardTitle>
                </div>
                <CardDescription className='max-w-md'>
                  {t('updates.feedback.description')}
                </CardDescription>
              </div>
              <Button
                onClick={() => setContactDialogOpen(true)}
                className='border border-[#c5d13f]/20 bg-[#c5d13f]/10 text-[#c5d13f] hover:border-[#c5d13f]/30 hover:bg-[#c5d13f]/20'
              >
                <IconSpeakerphone className='mr-2 h-4 w-4' />
                {t('updates.feedback.sendSuggestion')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
