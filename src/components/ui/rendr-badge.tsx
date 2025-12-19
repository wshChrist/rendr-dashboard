'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge style RendR
 * Design minimaliste monochrome
 */
const rendrBadgeVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        // Style par défaut - fond léger
        default:
          'bg-white/10 text-white border border-white/10 hover:bg-white/15',
        // Style outline
        outline:
          'bg-transparent text-white/80 border border-white/20 hover:border-white/30',
        // Style solid - plus visible
        solid: 'bg-white text-zinc-900 hover:bg-white/90',
        // Style success/positif
        success: 'bg-white/10 text-white border border-white/20',
        // Style warning
        warning: 'bg-white/5 text-white/70 border border-white/10',
        // Style accent (olive/vert du site)
        accent: 'bg-[#c5d13f]/10 text-[#c5d13f] border border-[#c5d13f]/20',
        // Style muted
        muted: 'bg-white/5 text-muted-foreground',
        // Style pill - pour les tags
        pill: 'bg-zinc-800 text-white/80 border-0'
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px] rounded-md',
        default: 'px-2.5 py-1 rounded-lg',
        lg: 'px-3 py-1.5 text-sm rounded-lg'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface RendRBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof rendrBadgeVariants> {
  /** Indicateur de point coloré */
  dot?: boolean;
  /** Couleur du point */
  dotColor?: 'green' | 'yellow' | 'red' | 'white';
  /** Icône à gauche */
  icon?: React.ReactNode;
}

const dotColors = {
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
  white: 'bg-white'
};

const RendRBadge = React.forwardRef<HTMLSpanElement, RendRBadgeProps>(
  (
    {
      className,
      variant,
      size,
      dot,
      dotColor = 'green',
      icon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(rendrBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn('h-1.5 w-1.5 rounded-full', dotColors[dotColor])}
          />
        )}
        {icon && <span className='opacity-80'>{icon}</span>}
        {children}
      </span>
    );
  }
);
RendRBadge.displayName = 'RendRBadge';

/**
 * Status Badge - pour afficher des statuts
 */
interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'active' | 'pending' | 'inactive' | 'error' | 'success';
}

const statusConfig = {
  active: {
    label: 'Actif',
    color: 'green' as const,
    variant: 'success' as const
  },
  pending: {
    label: 'En attente',
    color: 'yellow' as const,
    variant: 'warning' as const
  },
  inactive: {
    label: 'Inactif',
    color: 'white' as const,
    variant: 'muted' as const
  },
  error: {
    label: 'Erreur',
    color: 'red' as const,
    variant: 'warning' as const
  },
  success: {
    label: 'Succès',
    color: 'green' as const,
    variant: 'success' as const
  }
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, ...props }, ref) => {
    const config = statusConfig[status];
    return (
      <RendRBadge
        ref={ref}
        variant={config.variant}
        dot
        dotColor={config.color}
        className={className}
        {...props}
      >
        {config.label}
      </RendRBadge>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

/**
 * Tag - style tag/chip
 */
interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  removable?: boolean;
  onRemove?: () => void;
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, removable, onRemove, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5',
          'rounded-full px-3 py-1',
          'bg-zinc-800 text-xs font-medium text-white/80',
          'transition-all duration-200',
          'hover:bg-zinc-700',
          className
        )}
        {...props}
      >
        {children}
        {removable && (
          <button
            onClick={onRemove}
            className='ml-1 transition-colors hover:text-white'
          >
            <svg
              className='h-3 w-3'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);
Tag.displayName = 'Tag';

/**
 * Social Badge - pour les liens réseaux sociaux style RendR
 */
interface SocialBadgeProps extends React.HTMLAttributes<HTMLAnchorElement> {
  platform: string;
  icon: React.ReactNode;
  href?: string;
}

const SocialBadge = React.forwardRef<HTMLAnchorElement, SocialBadgeProps>(
  ({ className, platform, icon, href = '#', ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className={cn(
          'inline-flex items-center justify-between gap-4',
          'rounded-xl px-4 py-3',
          'border border-white/10 bg-zinc-900',
          'text-sm font-medium text-white',
          'transition-all duration-300',
          'hover:border-white/20 hover:bg-zinc-800',
          'group',
          className
        )}
        {...props}
      >
        <span>{platform}</span>
        <span className='rounded-lg bg-white/10 p-1.5 transition-colors group-hover:bg-white/20'>
          {icon}
        </span>
      </a>
    );
  }
);
SocialBadge.displayName = 'SocialBadge';

export { RendRBadge, StatusBadge, Tag, SocialBadge, rendrBadgeVariants };
