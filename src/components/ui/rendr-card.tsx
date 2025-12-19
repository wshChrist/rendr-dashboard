'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card style RendR - Design inspiré du site principal
 * Bordures arrondies importantes, glassmorphism subtil
 */

interface RendRCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid' | 'outline' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

const RendRCard = React.forwardRef<HTMLDivElement, RendRCardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = true,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl transition-all duration-300',
          paddingClasses[padding],
          // Variantes
          variant === 'default' && [
            'bg-card border border-white/5',
            'shadow-sm'
          ],
          variant === 'glass' && [
            'backdrop-blur-xl',
            'bg-white/[0.03]',
            'border border-white/10',
            'shadow-lg shadow-black/10'
          ],
          variant === 'solid' && ['bg-zinc-900', 'border border-white/5'],
          variant === 'outline' && ['bg-transparent', 'border border-white/10'],
          variant === 'elevated' && [
            'bg-card',
            'border border-white/5',
            'shadow-xl shadow-black/20'
          ],
          // Hover effect
          hover && [
            'hover:border-white/10',
            'hover:shadow-lg hover:shadow-black/20',
            'hover:-translate-y-0.5'
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
RendRCard.displayName = 'RendRCard';

/**
 * Header de card RendR
 */
interface RendRCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const RendRCardHeader = React.forwardRef<HTMLDivElement, RendRCardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4', className)}
        {...props}
      >
        {title || subtitle ? (
          <div className='flex flex-col gap-1'>
            {title && (
              <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
            )}
            {subtitle && (
              <p className='text-muted-foreground text-sm'>{subtitle}</p>
            )}
          </div>
        ) : (
          children
        )}
        {action && <div className='flex-shrink-0'>{action}</div>}
      </div>
    );
  }
);
RendRCardHeader.displayName = 'RendRCardHeader';

/**
 * Contenu de card RendR
 */
const RendRCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('mt-4', className)} {...props} />;
});
RendRCardContent.displayName = 'RendRCardContent';

/**
 * Footer de card RendR
 */
const RendRCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'mt-6 flex items-center gap-4 border-t border-white/5 pt-4',
        className
      )}
      {...props}
    />
  );
});
RendRCardFooter.displayName = 'RendRCardFooter';

/**
 * Feature Card style RendR (comme dans la section "Comment ça fonctionne")
 */
interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  number?: string | number;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, icon, title, description, number, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative',
          'rounded-2xl p-6',
          'bg-zinc-900/50 backdrop-blur-sm',
          'border border-white/5',
          'transition-all duration-300',
          'hover:border-white/10 hover:bg-zinc-900/70',
          className
        )}
        {...props}
      >
        {/* Numéro en arrière-plan */}
        {number !== undefined && (
          <span className='absolute top-4 right-4 text-5xl font-bold text-white/5 select-none'>
            {typeof number === 'number' && number < 10 ? `0${number}` : number}
          </span>
        )}

        {/* Icône */}
        {icon && (
          <div
            className={cn(
              'inline-flex items-center justify-center',
              'h-12 w-12 rounded-xl',
              'border border-white/10 bg-white/5',
              'mb-4',
              'transition-colors group-hover:bg-white/10'
            )}
          >
            {icon}
          </div>
        )}

        {/* Contenu */}
        <h4 className='text-foreground mb-2 text-lg font-semibold'>{title}</h4>
        {description && (
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {description}
          </p>
        )}
      </div>
    );
  }
);
FeatureCard.displayName = 'FeatureCard';

/**
 * Stat Card style RendR (pour les grandes statistiques)
 */
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  suffix?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, value, label, icon, trend, suffix, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          'rounded-2xl p-6',
          'bg-zinc-900/30 backdrop-blur-sm',
          'border border-white/5',
          'transition-all duration-300',
          'hover:border-white/10 hover:bg-zinc-900/50',
          'group',
          className
        )}
        {...props}
      >
        <div className='flex items-start justify-between'>
          <div className='space-y-2'>
            {/* Label */}
            <p className='text-muted-foreground flex items-center gap-2 text-sm'>
              {icon && <span className='opacity-70'>{icon}</span>}
              {label}
            </p>

            {/* Valeur */}
            <div className='text-foreground stat-number text-3xl font-bold md:text-4xl'>
              {value}
              {suffix && (
                <span className='text-muted-foreground ml-1 text-xl'>
                  {suffix}
                </span>
              )}
            </div>
          </div>

          {/* Trend */}
          {trend && (
            <div
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium',
                trend.positive
                  ? 'bg-white/10 text-white'
                  : 'text-muted-foreground bg-white/5'
              )}
            >
              {trend.positive ? '+' : ''}
              {trend.value}%
            </div>
          )}
        </div>

        {/* Effet de brillance au hover */}
        <div className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
          <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full' />
        </div>
      </div>
    );
  }
);
StatCard.displayName = 'StatCard';

/**
 * Bento Card pour layouts grille style RendR
 */
interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 'default' | 'wide' | 'tall' | 'large';
}

const spanClasses = {
  default: '',
  wide: 'md:col-span-2',
  tall: 'md:row-span-2',
  large: 'md:col-span-2 md:row-span-2'
};

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, span = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-6',
          'bg-zinc-900/30',
          'border border-white/5',
          'transition-all duration-300',
          'hover:border-white/10 hover:bg-zinc-900/50',
          spanClasses[span],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BentoCard.displayName = 'BentoCard';

export {
  RendRCard,
  RendRCardHeader,
  RendRCardContent,
  RendRCardFooter,
  FeatureCard,
  StatCard,
  BentoCard
};
