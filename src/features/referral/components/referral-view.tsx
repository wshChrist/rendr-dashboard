'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  IconUsers,
  IconGift,
  IconCopy,
  IconCheck,
  IconShare,
  IconBrandTwitter,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconPercentage,
  IconChartBar,
  IconLink,
  IconLoader2,
  IconChevronRight,
  IconTrendingUp
} from '@tabler/icons-react';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';
import { ReferralTable } from './referral-table';
import type { ReferredUser } from './referral-table-columns';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AnimatedNumber,
  AnimatedInteger
} from '@/components/ui/animated-number';
import Link from 'next/link';

interface ReferralData {
  code: string | null;
  link: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  commissionRate: number;
}

export function ReferralView() {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData>({
    code: null,
    link: '',
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    commissionRate: 10
  });
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Charger les données de parrainage
      const referralResponse = await fetch('/api/referral');
      if (referralResponse.ok) {
        const data = await referralResponse.json();
        setReferralData(data);
      } else {
        const errorData = await referralResponse.json();
        // Si c'est juste un code manquant, ce n'est pas une erreur critique
        if (errorData.error !== t('referral.errors.codeNotFound')) {
          toast.error(t('referral.errors.loadError'));
        }
      }

      // Charger la liste des filleuls
      const usersResponse = await fetch('/api/referral/users');
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        setReferredUsers(users);
      } else {
        toast.error(t('referral.errors.loadUsersError'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error(t('common.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('referral.linkCopied'));
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    setIsCreatingCode(true);

    if (!newCode.trim()) {
      setCodeError(t('referral.codeRequired'));
      setIsCreatingCode(false);
      return;
    }

    try {
      const response = await fetch('/api/referral/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referral_code: newCode.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setCodeError(data.message || t('referral.errors.createError'));
        setIsCreatingCode(false);
        return;
      }

      toast.success(t('referral.success.codeCreated'));
      setNewCode('');
      // Recharger les données
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la création du code:', error);
      setCodeError(t('referral.errors.createError'));
    } finally {
      setIsCreatingCode(false);
    }
  };

  const shareLink = (
    platform: 'native' | 'twitter' | 'telegram' | 'whatsapp'
  ) => {
    if (!referralData.link) {
      toast.error(t('referral.createCodeFirst'));
      return;
    }

    const text = t('referral.shareText', { link: referralData.link });
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(referralData.link);

    switch (platform) {
      case 'native':
        if (navigator.share) {
          navigator
            .share({
              title: t('referral.shareTitle'),
              text: text,
              url: referralData.link
            })
            .catch(() => {
              // L'utilisateur a annulé le partage
            });
        } else {
          copyToClipboard(referralData.link);
        }
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
          '_blank'
        );
        break;
      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
          '_blank'
        );
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        break;
    }
  };

  const averageEarnings = useMemo(() => {
    if (referralData.activeReferrals > 0 && referralData.totalEarnings > 0) {
      return referralData.totalEarnings / referralData.activeReferrals;
    }
    return 0;
  }, [referralData]);

  return (
    <div className='space-y-6'>
      {/* Stats Cards - Style Overview */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Filleuls Total */}
        <div
          className={cn(
            'relative overflow-hidden',
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300 ease-out',
            'hover:border-white/10 hover:bg-zinc-900/60',
            'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationFillMode: 'forwards' }}
        >
          <div className='mb-4 flex items-start justify-between'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300'>
              <IconUsers className='h-5 w-5' />
            </div>
            <RendRBadge variant='outline' size='sm'>
              {t('referral.totalReferrals')}
            </RendRBadge>
          </div>
          <p className='text-muted-foreground mb-1 text-sm'>
            {t('referral.totalReferrals')}
          </p>
          <div className='text-foreground stat-number mb-4 text-2xl font-bold md:text-3xl'>
            {isLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <AnimatedInteger value={referralData.totalReferrals || 0} />
            )}
          </div>
          <div className='space-y-1.5 border-t border-white/5 pt-4'>
            <div className='text-foreground/90 text-sm font-medium'>
              {isLoading ? '...' : referralData.activeReferrals || 0}{' '}
              {t('referral.active')}
            </div>
            <div className='text-muted-foreground text-sm'>
              {t('referral.activeReferrals')}
            </div>
          </div>
        </div>

        {/* Gains Totaux */}
        <Link href='#referrals' className='group'>
          <div
            className={cn(
              'relative overflow-hidden',
              'rounded-2xl p-5 md:p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-[#c5d13f]/20',
              'transition-all duration-300 ease-out',
              'hover:border-[#c5d13f]/40 hover:bg-zinc-900/60',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              'cursor-pointer',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-4 flex items-start justify-between'>
              <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2 transition-all duration-300 group-hover:border-[#c5d13f]/40 group-hover:bg-[#c5d13f]/20'>
                <IconGift className='h-5 w-5 text-[#c5d13f]' />
              </div>
              <RendRBadge variant='accent' dot dotColor='green' size='sm'>
                {t('referral.totalEarnings')}
              </RendRBadge>
            </div>
            <p className='text-muted-foreground mb-1 text-sm'>
              {t('referral.totalEarnings')}
            </p>
            <div className='text-foreground stat-number mb-4 text-2xl font-bold text-[#c5d13f] md:text-3xl'>
              {isLoading ? (
                <Skeleton className='h-8 w-24' />
              ) : (
                <AnimatedNumber
                  value={referralData.totalEarnings || 0}
                  suffix='€'
                />
              )}
            </div>
            <div className='space-y-1.5 border-t border-white/5 pt-4'>
              <div className='text-foreground/90 text-sm font-medium'>
                +
                {isLoading
                  ? '...'
                  : (referralData.pendingEarnings || 0).toFixed(2)}
                € {t('referral.pending')}
              </div>
              <div className='text-muted-foreground group-hover:text-foreground/80 flex items-center gap-1.5 text-sm transition-colors'>
                {t('referral.viewReferrals')}
                <IconChevronRight className='h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1' />
              </div>
            </div>
          </div>
        </Link>

        {/* Taux de Commission */}
        <div
          className={cn(
            'relative overflow-hidden',
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300 ease-out',
            'hover:border-white/10 hover:bg-zinc-900/60',
            'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-4 flex items-start justify-between'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300'>
              <IconPercentage className='h-5 w-5' />
            </div>
            <RendRBadge variant='outline' size='sm'>
              {referralData.commissionRate}%
            </RendRBadge>
          </div>
          <p className='text-muted-foreground mb-1 text-sm'>
            {t('referral.commissionRate')}
          </p>
          <div className='text-foreground stat-number mb-4 text-2xl font-bold md:text-3xl'>
            {referralData.commissionRate}%
          </div>
          <div className='space-y-1.5 border-t border-white/5 pt-4'>
            <div className='text-foreground/90 text-sm font-medium'>
              {t('referral.fromReferrals')}
            </div>
            <div className='text-muted-foreground text-sm'>
              {t('referral.commissionDescription')}
            </div>
          </div>
        </div>

        {/* Gain Moyen */}
        <div
          className={cn(
            'relative overflow-hidden',
            'rounded-2xl p-5 md:p-6',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300 ease-out',
            'hover:border-white/10 hover:bg-zinc-900/60',
            'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-4 flex items-start justify-between'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300'>
              <IconChartBar className='h-5 w-5' />
            </div>
            <RendRBadge variant='outline' size='sm'>
              <IconTrendingUp className='h-3 w-3' />
            </RendRBadge>
          </div>
          <p className='text-muted-foreground mb-1 text-sm'>
            {t('referral.averageEarnings')}
          </p>
          <div className='text-foreground stat-number mb-4 text-2xl font-bold md:text-3xl'>
            {isLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <AnimatedNumber value={averageEarnings} suffix='€' />
            )}
          </div>
          <div className='space-y-1.5 border-t border-white/5 pt-4'>
            <div className='text-foreground/90 text-sm font-medium'>
              {t('referral.perActiveReferral')}
            </div>
            <div className='text-muted-foreground text-sm'>
              {t('referral.averageDescription')}
            </div>
          </div>
        </div>
      </div>

      {/* Layout en deux colonnes */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Code/Lien de parrainage */}
        <Card
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
                <IconLink className='h-5 w-5 text-[#c5d13f]' />
              </div>
              <div>
                <CardTitle>
                  {referralData.code
                    ? t('referral.yourLink')
                    : t('referral.createYourCode')}
                </CardTitle>
                <CardDescription>
                  {referralData.code
                    ? t('referral.shareLinkDescription', {
                        rate: referralData.commissionRate
                      })
                    : t('referral.chooseUniqueCode')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-5'>
            {!referralData.code ? (
              <form onSubmit={handleCreateCode} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='code' className='text-sm font-medium'>
                    {t('referral.yourCode')}
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='code'
                      value={newCode}
                      onChange={(e) => {
                        setNewCode(e.target.value.toUpperCase());
                        setCodeError('');
                      }}
                      placeholder={t('pages.referral.codePlaceholder')}
                      className='border-white/10 bg-white/5 font-mono'
                      maxLength={20}
                      disabled={isCreatingCode}
                    />
                    <Button
                      type='submit'
                      disabled={isCreatingCode || !newCode.trim()}
                      className='bg-[#c5d13f] text-black hover:bg-[#c5d13f]/90'
                    >
                      {isCreatingCode ? (
                        <IconLoader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        t('referral.createCode')
                      )}
                    </Button>
                  </div>
                  {codeError && (
                    <p className='text-sm text-red-500'>{codeError}</p>
                  )}
                  <p className='text-muted-foreground text-xs'>
                    {t('referral.codeRules')}
                  </p>
                </div>
              </form>
            ) : (
              <>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    {t('referral.yourLink')}
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      value={referralData.link}
                      readOnly
                      className='border-white/10 bg-white/5 font-mono'
                    />
                    <Button
                      variant='outline'
                      onClick={() => copyToClipboard(referralData.link)}
                    >
                      {copied ? (
                        <IconCheck className='h-4 w-4 text-[#c5d13f]' />
                      ) : (
                        <IconCopy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className='flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3'>
                  <span className='text-muted-foreground text-sm'>
                    {t('referral.yourCode')}:
                  </span>
                  <RendRBadge variant='outline' size='lg' className='font-mono'>
                    {referralData.code}
                  </RendRBadge>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => copyToClipboard(referralData.code || '')}
                  >
                    <IconCopy className='h-4 w-4' />
                  </Button>
                </div>

                <Separator />

                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    {t('referral.share')}
                  </Label>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => shareLink('native')}
                      className='flex-1'
                    >
                      <IconShare className='mr-2 h-4 w-4' />
                      {t('referral.share')}
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => shareLink('twitter')}
                    >
                      <IconBrandTwitter className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => shareLink('telegram')}
                    >
                      <IconBrandTelegram className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => shareLink('whatsapp')}
                    >
                      <IconBrandWhatsapp className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
        >
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconGift className='h-5 w-5' />
              </div>
              <div>
                <CardTitle>{t('referral.howItWorks')}</CardTitle>
                <CardDescription>
                  {t('referral.howItWorksDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[
                {
                  step: 1,
                  title: t('referral.shareLink'),
                  desc: t('referral.step1Description')
                },
                {
                  step: 2,
                  title: t('referral.theySignUp'),
                  desc: t('referral.step2Description')
                },
                {
                  step: 3,
                  title: t('referral.youEarn'),
                  desc: t('referral.step3Description', {
                    rate: referralData.commissionRate
                  })
                }
              ].map((item, index) => (
                <div key={item.step}>
                  <div className='flex gap-4'>
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-sm font-bold'>
                      {item.step}
                    </div>
                    <div className='flex-1 space-y-1'>
                      <h4 className='text-sm font-semibold'>{item.title}</h4>
                      <p className='text-muted-foreground text-xs'>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  {index < 2 && <Separator className='my-4' />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referred Users */}
      <Card
        id='referrals'
        className={cn(
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
      >
        <CardHeader>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconUsers className='h-5 w-5' />
            </div>
            <div>
              <CardTitle>{t('referral.yourReferrals')}</CardTitle>
              <CardDescription>{t('referral.manageReferrals')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-16 w-full' />
              ))}
            </div>
          ) : (
            <ReferralTable data={referredUsers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
