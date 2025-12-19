'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Sphère 3D décorative style RendR
 * Inspirée des éléments visuels du site principal
 */
interface RendRSphereProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'metallic' | 'glass' | 'gradient' | 'dark';
  animate?: boolean;
  blur?: boolean;
}

const sphereSizes = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
};

const RendRSphere = React.forwardRef<HTMLDivElement, RendRSphereProps>(
  (
    {
      className,
      size = 'md',
      variant = 'metallic',
      animate = true,
      blur = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-none rounded-full select-none',
          sphereSizes[size],
          animate && 'animate-float',
          blur && 'blur-sm',
          // Variantes de style
          variant === 'metallic' && [
            'bg-gradient-to-br from-zinc-300 via-zinc-500 to-zinc-800',
            'shadow-xl shadow-black/30',
            'before:absolute before:inset-0 before:rounded-full',
            'before:bg-gradient-to-tl before:from-white/40 before:via-transparent before:to-transparent',
            'relative overflow-hidden'
          ],
          variant === 'glass' && [
            'bg-gradient-to-br from-white/20 via-white/5 to-transparent',
            'backdrop-blur-md',
            'border border-white/10',
            'shadow-lg shadow-white/5'
          ],
          variant === 'gradient' && [
            'bg-gradient-to-br from-zinc-400 via-zinc-600 to-zinc-900',
            'shadow-xl shadow-black/40'
          ],
          variant === 'dark' && [
            'bg-gradient-to-br from-zinc-700 via-zinc-900 to-black',
            'shadow-2xl shadow-black/50',
            'before:absolute before:inset-0 before:rounded-full',
            'before:bg-gradient-to-tl before:from-white/10 before:via-transparent before:to-transparent',
            'relative overflow-hidden'
          ],
          className
        )}
        {...props}
      >
        {/* Reflet interne pour effet 3D */}
        <div className='absolute inset-2 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-60' />
      </div>
    );
  }
);
RendRSphere.displayName = 'RendRSphere';

/**
 * Forme hélicoïdale/fleur métallique style RendR
 */
interface RendRHelixProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const helixSizes = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-48 h-48'
};

const RendRHelix = React.forwardRef<HTMLDivElement, RendRHelixProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-none relative select-none',
          helixSizes[size],
          className
        )}
        {...props}
      >
        {/* Pétales de l'hélice */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((rotation, i) => (
          <div
            key={rotation}
            className='absolute top-1/2 left-1/2 h-3 w-1/2 origin-left -translate-y-1/2'
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div
              className={cn(
                'h-full w-full rounded-full',
                'bg-gradient-to-r from-zinc-400 via-zinc-600 to-zinc-800',
                'shadow-md shadow-black/30'
              )}
              style={{
                animationDelay: `${i * 100}ms`
              }}
            />
          </div>
        ))}
      </div>
    );
  }
);
RendRHelix.displayName = 'RendRHelix';

/**
 * Astérisque décoratif RendR (✱)
 */
interface RendRAsteriskProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const asteriskSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

const RendRAsterisk = React.forwardRef<HTMLSpanElement, RendRAsteriskProps>(
  ({ className, size = 'md', animated = false, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'text-white/60',
          asteriskSizes[size],
          animated && 'animate-pulse-subtle',
          className
        )}
        {...props}
      >
        ✱
      </span>
    );
  }
);
RendRAsterisk.displayName = 'RendRAsterisk';

/**
 * Conteneur de décoration flottante
 * Pour positionner les sphères dans les coins des sections
 */
interface DecorationContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const positionClasses = {
  'top-left': '-top-10 -left-10',
  'top-right': '-top-10 -right-10',
  'bottom-left': '-bottom-10 -left-10',
  'bottom-right': '-bottom-10 -right-10'
};

const DecorationContainer = React.forwardRef<
  HTMLDivElement,
  DecorationContainerProps
>(({ className, position = 'top-right', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none absolute z-0 opacity-40',
        positionClasses[position],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DecorationContainer.displayName = 'DecorationContainer';

/**
 * Ligne de grille décorative style RendR
 */
interface GridLineProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
}

const GridLine = React.forwardRef<HTMLDivElement, GridLineProps>(
  ({ className, direction = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-none',
          direction === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          'bg-gradient-to-r from-transparent via-white/10 to-transparent',
          className
        )}
        {...props}
      />
    );
  }
);
GridLine.displayName = 'GridLine';

export {
  RendRSphere,
  RendRHelix,
  RendRAsterisk,
  DecorationContainer,
  GridLine
};
