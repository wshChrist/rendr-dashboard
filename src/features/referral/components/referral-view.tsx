'use client';

import { useState } from 'react';
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
  IconLink
} from '@tabler/icons-react';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';
import { ReferralTable } from './referral-table';
import type { ReferredUser } from './referral-table-columns';

// Mock data pour le parrainage
const referralData = {
  code: 'RENDR-ABC123',
  link: 'https://rendr.io/ref/ABC123',
  totalReferrals: 5,
  activeReferrals: 3,
  totalEarnings: 125.5,
  pendingEarnings: 15.0,
  commissionRate: 10 // 10% du cashback des filleuls
};

const referredUsers: ReferredUser[] = [
  {
    id: 1,
    name: 'Jean D.',
    joined: '2024-11-15T10:30:00',
    status: 'active',
    earnings: 45.0
  },
  {
    id: 2,
    name: 'Marie L.',
    joined: '2024-10-20T14:15:00',
    status: 'active',
    earnings: 62.5
  },
  {
    id: 3,
    name: 'Pierre M.',
    joined: '2024-12-01T09:45:00',
    status: 'active',
    earnings: 18.0
  },
  {
    id: 4,
    name: 'Sophie B.',
    joined: '2024-12-10T16:20:00',
    status: 'pending',
    earnings: 0
  },
  {
    id: 5,
    name: 'Lucas R.',
    joined: '2024-12-12T11:00:00',
    status: 'pending',
    earnings: 0
  }
];

export function ReferralView() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              Filleuls Total
            </span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {referralData.totalReferrals}
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            {referralData.activeReferrals} actifs
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
            <span className='text-muted-foreground text-sm'>Gains Totaux</span>
          </div>
          <p className='text-foreground stat-number text-3xl font-bold'>
            {referralData.totalEarnings.toFixed(2)}€
          </p>
          <p className='mt-1 text-sm text-[#c5d13f]'>
            +{referralData.pendingEarnings.toFixed(2)}€ en attente
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
              Taux de Commission
            </span>
          </div>
          <p className='text-foreground stat-number text-3xl font-bold'>
            {referralData.commissionRate}%
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Du cashback de vos filleuls
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
            <span className='text-muted-foreground text-sm'>Gain Moyen</span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            {referralData.activeReferrals > 0
              ? (
                  referralData.totalEarnings / referralData.activeReferrals
                ).toFixed(2)
              : '0.00'}
            €
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Par filleul actif
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
        <div className='mb-5 flex items-center gap-2'>
          <span className='rounded-xl border border-white/5 bg-white/5 p-2'>
            <IconLink className='h-4 w-4' />
          </span>
          <div>
            <h3 className='text-lg font-semibold'>Votre lien de parrainage</h3>
            <p className='text-muted-foreground text-sm'>
              Partagez ce lien pour gagner {referralData.commissionRate}% du
              cashback de vos filleuls
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
              Votre code de parrainage:
            </span>
            <RendRBadge variant='outline' size='lg' className='font-mono'>
              {referralData.code}
            </RendRBadge>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => copyToClipboard(referralData.code)}
            >
              <IconCopy className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' size='sm'>
              <IconShare className='mr-2 h-4 w-4' />
              Partager
            </Button>
            <Button variant='outline' size='sm'>
              <IconBrandTwitter className='mr-2 h-4 w-4' />
              Twitter
            </Button>
            <Button variant='outline' size='sm'>
              <IconBrandTelegram className='mr-2 h-4 w-4' />
              Telegram
            </Button>
            <Button variant='outline' size='sm'>
              <IconBrandWhatsapp className='mr-2 h-4 w-4' />
              WhatsApp
            </Button>
          </div>
        </div>
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
              title: 'Partagez votre lien',
              desc: 'Envoyez votre lien de parrainage à vos amis traders'
            },
            {
              step: 2,
              title: "Ils s'inscrivent",
              desc: 'Vos filleuls créent leur compte et connectent leurs brokers'
            },
            {
              step: 3,
              title: 'Vous gagnez',
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
            <h3 className='text-lg font-semibold'>Vos filleuls</h3>
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
