import PageContainer from '@/components/layout/page-container';
import React from 'react';
import { StatsCards } from '@/features/overview/components/stats-cards';
import { PlatformUpdates } from '@/features/overview/components/platform-updates';
import { WelcomeHeader } from '@/features/overview/components/welcome-header';
import { SectionHeading } from '@/components/ui/section-heading';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className='relative flex flex-1 flex-col space-y-6'>
        {/* Décorations de fond subtiles */}
        <div className='pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-white/[0.02] blur-3xl' />
        <div className='pointer-events-none absolute bottom-1/4 left-0 h-48 w-48 rounded-full bg-white/[0.01] blur-3xl' />

        {/* Header personnalisé avec nom de l'utilisateur */}
        <WelcomeHeader />

        {/* Stats Cards animées */}
        <section>
          <StatsCards />
        </section>

        {/* Section principale : Updates + Activité */}
        <section className='space-y-4'>
          <SectionHeading
            title='Aperçu'
            size='sm'
            className='animate-fade-in-up opacity-0'
            style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
          />
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* Nouveautés de la plateforme */}
            <div
              className='animate-fade-in-up opacity-0'
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              <PlatformUpdates />
            </div>
            {/* Activité récente */}
            <div
              className='animate-fade-in-up opacity-0'
              style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
            >
              {sales}
            </div>
          </div>
        </section>

        {/* Charts avec animations décalées */}
        <section className='space-y-4'>
          <SectionHeading
            title='Statistiques'
            size='sm'
            className='animate-fade-in-up opacity-0'
            style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}
          />
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <div
              className='animate-fade-in-up col-span-4 opacity-0'
              style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
            >
              {bar_stats}
            </div>
            <div
              className='animate-fade-in-up col-span-4 opacity-0 md:col-span-3'
              style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}
            >
              {pie_stats}
            </div>
            <div
              className='animate-fade-in-up col-span-7 opacity-0'
              style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
            >
              {area_stats}
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
