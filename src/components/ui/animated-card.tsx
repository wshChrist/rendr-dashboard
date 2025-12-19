'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  index?: number;
  animation?: 'fade-up' | 'scale' | 'slide-left' | 'slide-right';
  hover?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      className,
      index = 0,
      animation = 'fade-up',
      hover = true,
      style,
      ...props
    },
    ref
  ) => {
    const animationClass = {
      'fade-up': 'animate-fade-in-up',
      scale: 'animate-scale-in',
      'slide-left': 'animate-slide-in-left',
      'slide-right': 'animate-slide-in-right'
    }[animation];

    const delay = index * 100;

    return (
      <Card
        ref={ref}
        className={cn(
          animationClass,
          hover && 'card-hover',
          'opacity-0',
          className
        )}
        style={{
          animationDelay: `${delay}ms`,
          animationFillMode: 'forwards',
          ...style
        }}
        {...props}
      />
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

export { AnimatedCard };
