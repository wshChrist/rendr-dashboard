'use client';

import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { RendRAsterisk } from '@/components/ui/rendr-decorations';

interface PageHeaderProps {
  title: string;
  description?: string;
  personalGreeting?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  personalGreeting = false,
  children,
  className
}: PageHeaderProps) {
  const { user } = useUser();
  const firstName = user?.firstName;

  // Créer un titre personnalisé si demandé
  const displayTitle =
    personalGreeting && firstName ? title.replace('{name}', firstName) : title;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className='animate-fade-in-up flex items-start justify-between opacity-0'
        style={{ animationFillMode: 'forwards' }}
      >
        <div className='space-y-2'>
          {/* Section indicator style RendR */}
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <RendRAsterisk size='sm' />
            <span>{displayTitle}</span>
            <div className='h-px w-8 bg-gradient-to-r from-white/30 to-transparent' />
          </div>

          {description && (
            <p className='text-muted-foreground max-w-2xl'>{description}</p>
          )}
        </div>
        {children && <div className='flex items-center gap-2'>{children}</div>}
      </div>
    </div>
  );
}
