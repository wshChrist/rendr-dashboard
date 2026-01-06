'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
  direction = 'up'
}: FadeInProps) {
  const variants = {
    up: { y: 20, opacity: 0 },
    down: { y: -20, opacity: 0 },
    left: { x: 20, opacity: 0 },
    right: { x: -20, opacity: 0 },
    none: { opacity: 0 }
  };

  const animate = {
    y: direction === 'up' ? 0 : direction === 'down' ? 0 : undefined,
    x: direction === 'left' ? 0 : direction === 'right' ? 0 : undefined,
    opacity: 1
  };

  return (
    <motion.div
      initial={variants[direction]}
      animate={animate}
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
