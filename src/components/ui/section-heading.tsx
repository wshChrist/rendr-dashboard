'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { RendRAsterisk } from './rendr-decorations';

/**
 * Section Heading style RendR
 * Format : ✱ Titre de section [trait]
 * Inspiré du design du site principal
 */
interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Titre de la section */
  title: string;
  /** Sous-titre ou description */
  subtitle?: string;
  /** Variante de taille */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Afficher l'astérisque */
  showAsterisk?: boolean;
  /** Alignement */
  align?: 'left' | 'center' | 'right';
}

const sizeClasses = {
  sm: {
    container: 'gap-1',
    number: 'text-xs',
    title: 'text-lg font-semibold',
    subtitle: 'text-sm'
  },
  md: {
    container: 'gap-1.5',
    number: 'text-sm',
    title: 'text-xl md:text-2xl font-semibold',
    subtitle: 'text-sm md:text-base'
  },
  lg: {
    container: 'gap-2',
    number: 'text-sm',
    title: 'text-2xl md:text-3xl font-bold',
    subtitle: 'text-base md:text-lg'
  },
  xl: {
    container: 'gap-2',
    number: 'text-base',
    title: 'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight',
    subtitle: 'text-lg md:text-xl'
  }
};

const alignClasses = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end'
};

const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  (
    {
      className,
      title,
      subtitle,
      size = 'md',
      showAsterisk = true,
      align = 'left',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          sizeClasses[size].container,
          alignClasses[align],
          className
        )}
        {...props}
      >
        {/* Ligne avec étoile, titre et trait (comme WelcomeHeader) */}
        <div
          className={cn(
            'flex items-center gap-2',
            sizeClasses[size].number,
            'text-muted-foreground'
          )}
        >
          {showAsterisk && <RendRAsterisk size='sm' />}
          {/* Titre principal sur la même ligne avec la même police et couleur */}
          <span>{title}</span>
          {/* Ligne décorative */}
          <div className='h-px w-8 bg-gradient-to-r from-white/30 to-transparent md:w-16' />
        </div>

        {/* Sous-titre */}
        {subtitle && (
          <p
            className={cn(
              sizeClasses[size].subtitle,
              'text-muted-foreground max-w-2xl'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    );
  }
);
SectionHeading.displayName = 'SectionHeading';

/**
 * Section Heading avec style italique comme sur le site RendR
 * Pour les grands titres accrocheurs
 */
interface HeroHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Partie en style normal */
  normalText?: string;
  /** Partie en italique */
  italicText?: string;
  /** Taille */
  size?: 'md' | 'lg' | 'xl';
}

const heroSizeClasses = {
  md: 'text-2xl md:text-3xl lg:text-4xl',
  lg: 'text-3xl md:text-4xl lg:text-5xl',
  xl: 'text-4xl md:text-5xl lg:text-6xl'
};

const HeroHeading = React.forwardRef<HTMLHeadingElement, HeroHeadingProps>(
  (
    { className, normalText, italicText, size = 'lg', children, ...props },
    ref
  ) => {
    return (
      <h1
        ref={ref}
        className={cn(
          'text-foreground leading-[1.1] font-bold tracking-tight',
          heroSizeClasses[size],
          className
        )}
        {...props}
      >
        {normalText && <span>{normalText} </span>}
        {italicText && <span className='italic'>{italicText}</span>}
        {children}
      </h1>
    );
  }
);
HeroHeading.displayName = 'HeroHeading';

/**
 * Stats Display style RendR
 * Grand nombre avec label
 */
interface StatDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  suffix?: string;
}

const StatDisplay = React.forwardRef<HTMLDivElement, StatDisplayProps>(
  ({ className, value, label, suffix, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-start gap-1', className)}
        {...props}
      >
        <div className='text-foreground text-3xl font-bold md:text-4xl'>
          {value}
          {suffix && (
            <span className='text-muted-foreground ml-1 text-lg md:text-xl'>
              {suffix}
            </span>
          )}
        </div>
        <div className='text-muted-foreground text-sm'>{label}</div>
      </div>
    );
  }
);
StatDisplay.displayName = 'StatDisplay';

export { SectionHeading, HeroHeading, StatDisplay };
