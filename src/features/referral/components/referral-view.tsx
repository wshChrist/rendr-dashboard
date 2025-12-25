'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  IconLoader2
} from '@tabler/icons-react';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';
import { ReferralTable } from './referral-table';
import type { ReferredUser } from './referral-table-columns';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
        if (errorData.error !== 'Code de parrainage non trouvé') {
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
      setCodeError('Le code est requis');
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

    const text = `Rejoins RendR et reçois du cashback sur tes trades ! ${referralData.link}`;
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

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <IconLoader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        {/* Filleuls Total */}
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
          <div className='mb-2 flex items-center gap-2'>
            <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconUsers className='h-4 w-4' />
            </span>
            <span className='text-muted-foreground text-sm'>
              {t('referral.totalReferrals')}
            </span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {referralData.totalReferrals || 0}
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            {referralData.activeReferrals || 0} {t('referral.active')}
          </p>
        </div>

        {/* Gains Totaux */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-[#c5d13f]/20',
            'transition-all duration-300',
            'hover:border-[#c5d13f]/40',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-2 flex items-center gap-2'>
            <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconGift className='h-4 w-4' />
            </span>
            <span className='text-muted-foreground text-sm'>
              {t('referral.totalEarnings')}
            </span>
          </div>
          <p className='text-foreground stat-number text-3xl font-bold'>
            {referralData.totalEarnings?.toFixed(2) || '0.00'}€
          </p>
          <p className='mt-1 text-sm text-[#c5d13f]'>
            +{referralData.pendingEarnings?.toFixed(2) || '0.00'}€{' '}
            {t('referral.pending')}
          </p>
        </div>

        {/* Taux de Commission */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-2 flex items-center gap-2'>
            <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconPercentage className='h-4 w-4' />
            </span>
            <span className='text-muted-foreground text-sm'>
              {t('referral.commissionRate')}
            </span>
          </div>
          <p className='text-foreground stat-number text-3xl font-bold'>
            {referralData.commissionRate}%
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            {t('referral.fromReferrals')}
          </p>
        </div>

        {/* Gain Moyen */}
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-2 flex items-center gap-2'>
            <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconChartBar className='h-4 w-4' />
            </span>
            <span className='text-muted-foreground text-sm'>
              {t('referral.averageEarnings')}
            </span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {referralData.activeReferrals > 0 && referralData.totalEarnings > 0
              ? (
                  referralData.totalEarnings / referralData.activeReferrals
                ).toFixed(2)
              : '0.00'}
            €
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            {t('referral.perActiveReferral')}
          </p>
        </div>
      </div>

      {/* Referral Link Card */}
      <div
        className={cn(
          'rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
      >
        {!referralData.code ? (
          /* Formulaire de création de code */
          <div>
            <div className='mb-5 flex items-center gap-2'>
              <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconLink className='h-4 w-4' />
              </span>
              <div>
                <h3 className='text-lg font-semibold'>
                  {t('referral.createYourCode')}
                </h3>
                <p className='text-muted-foreground text-sm'>
                  {t('referral.chooseUniqueCode')}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCode} className='space-y-4'>
              <div>
                <label className='text-muted-foreground mb-2 block text-sm font-medium'>
                  {t('referral.yourCode')}
                </label>
                <div className='flex gap-2'>
                  <Input
                    value={newCode}
                    onChange={(e) => {
                      setNewCode(e.target.value.toUpperCase());
                      setCodeError('');
                    }}
                    placeholder='EXEMPLE-CODE'
                    className='border-white/10 bg-white/5 font-mono'
                    maxLength={20}
                    disabled={isCreatingCode}
                  />
                  <Button
                    type='submit'
                    disabled={isCreatingCode || !newCode.trim()}
                  >
                    {isCreatingCode ? (
                      <IconLoader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      t('referral.createCode')
                    )}
                  </Button>
                </div>
                {codeError && (
                  <p className='mt-2 text-sm text-red-500'>{codeError}</p>
                )}
                <p className='text-muted-foreground mt-2 text-xs'>
                  {t('referral.codeRules')}
                </p>
              </div>
            </form>
          </div>
        ) : (
          /* Affichage du code existant */
          <>
            <div className='mb-5 flex items-center gap-2'>
              <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconLink className='h-4 w-4' />
              </span>
              <div>
                <h3 className='text-lg font-semibold'>
                  {t('referral.yourLink')}
                </h3>
                <p className='text-muted-foreground text-sm'>
                  {t('referral.shareLinkDescription', {
                    rate: referralData.commissionRate
                  })}
                </p>
              </div>
            </div>

            <div className='space-y-4'>
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

              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => shareLink('native')}
                >
                  <IconShare className='mr-2 h-4 w-4' />
                  {t('referral.share')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => shareLink('twitter')}
                >
                  <IconBrandTwitter className='mr-2 h-4 w-4' />
                  {t('referral.twitter')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => shareLink('telegram')}
                >
                  <IconBrandTelegram className='mr-2 h-4 w-4' />
                  {t('referral.telegram')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => shareLink('whatsapp')}
                >
                  <IconBrandWhatsapp className='mr-2 h-4 w-4' />
                  {t('referral.whatsapp')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* How it works */}
      <div
        className={cn(
          'rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
      >
        <h3 className='mb-6 text-lg font-semibold'>Comment ça marche ?</h3>
        <div className='grid gap-6 md:grid-cols-3'>
          {[
            {
              step: 1,
              title: t('referral.shareLink'),
              desc: t('pages.referral.description')
            },
            {
              step: 2,
              title: t('referral.theySignUp'),
              desc: 'Vos filleuls créent leur compte et connectent leurs brokers'
            },
            {
              step: 3,
              title: t('referral.youEarn'),
              desc: `Recevez ${referralData.commissionRate}% de leur cashback à vie !`
            }
          ].map((item) => (
            <div key={item.step} className='space-y-3 text-center'>
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-xl font-bold'>
                {item.step}
              </div>
              <h4 className='font-semibold'>{item.title}</h4>
              <p className='text-muted-foreground text-sm'>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referred Users */}
      <div
        className={cn(
          'rounded-2xl p-5 md:p-6',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
      >
        <div className='mb-6 flex items-center gap-2'>
          <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
            <IconUsers className='h-4 w-4' />
          </span>
          <div>
            <h3 className='text-lg font-semibold'>
              {t('referral.yourReferrals')}
            </h3>
            <p className='text-muted-foreground text-sm'>
              Gérez et suivez tous vos filleuls en un seul endroit
            </p>
          </div>
        </div>

        <ReferralTable data={referredUsers} />
      </div>
    </div>
  );
}
