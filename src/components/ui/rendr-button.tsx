'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { IconChevronRight, IconArrowRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

/**
 * Bouton style RendR - inspiré du site principal
 * Design : fond noir, texte blanc, chevron à droite
 */
const rendrButtonVariants = cva(
  'group inline-flex items-center justify-between gap-3 whitespace-nowrap font-medium transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-white/20',
  {
    variants: {
      variant: {
        // Style principal du site RendR - fond noir avec icône
        default:
          'bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 hover:border-white/20 hover:shadow-lg hover:shadow-white/5',
        // Style inversé - fond blanc/clair
        light:
          'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-lg',
        // Style outline - bordure uniquement
        outline:
          'bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-white/40',
        // Style ghost - pas de bordure
        ghost: 'bg-transparent text-white hover:bg-white/10',
        // Style CTA - accent olive/jaune-vert comme sur le site
        cta: 'bg-zinc-900 text-white border border-[#c5d13f]/30 hover:border-[#c5d13f]/60 hover:shadow-lg hover:shadow-[#c5d13f]/10',
        // Style secondary
        secondary:
          'bg-zinc-800/50 text-white/90 border border-white/5 hover:bg-zinc-800 hover:border-white/10'
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-lg',
        default: 'h-11 px-5 text-sm rounded-xl',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-base rounded-2xl'
      },
      iconPosition: {
        right: 'flex-row',
        left: 'flex-row-reverse',
        none: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      iconPosition: 'right'
    }
  }
);

export interface RendRButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rendrButtonVariants> {
  asChild?: boolean;
  icon?: 'chevron' | 'arrow' | 'none';
  iconClassName?: string;
}

const RendRButton = React.forwardRef<HTMLButtonElement, RendRButtonProps>(
  (
    {
      className,
      variant,
      size,
      iconPosition,
      asChild = false,
      icon = 'chevron',
      iconClassName,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const IconComponent = icon === 'arrow' ? IconArrowRight : IconChevronRight;
    const showIcon = icon !== 'none' && iconPosition !== 'none';

    return (
      <Comp
        className={cn(
          rendrButtonVariants({ variant, size, iconPosition, className })
        )}
        ref={ref}
        {...props}
      >
        <span className='flex-1 text-left'>{children}</span>
        {showIcon && (
          <span
            className={cn(
              'flex items-center justify-center rounded-lg bg-white/10 p-1.5 transition-all duration-300',
              'group-hover:translate-x-0.5 group-hover:bg-white/20',
              variant === 'light' &&
                'bg-zinc-900/10 group-hover:bg-zinc-900/20',
              iconClassName
            )}
          >
            <IconComponent className='h-4 w-4' />
          </span>
        )}
      </Comp>
    );
  }
);
RendRButton.displayName = 'RendRButton';

/**
 * Bouton icône style RendR - carré avec icône
 */
const rendrIconButtonVariants = cva(
  'inline-flex items-center justify-center transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-white/20',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 hover:border-white/20',
        light: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50',
        outline:
          'bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-white/40',
        ghost: 'bg-transparent text-white hover:bg-white/10'
      },
      size: {
        sm: 'h-9 w-9 rounded-lg',
        default: 'h-11 w-11 rounded-xl',
        lg: 'h-12 w-12 rounded-xl'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface RendRIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rendrIconButtonVariants> {
  asChild?: boolean;
}

const RendRIconButton = React.forwardRef<
  HTMLButtonElement,
  RendRIconButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(rendrIconButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
RendRIconButton.displayName = 'RendRIconButton';

export {
  RendRButton,
  RendRIconButton,
  rendrButtonVariants,
  rendrIconButtonVariants
};
