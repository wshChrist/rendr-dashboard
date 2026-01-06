'use client';

import { motion, useInView } from 'motion/react';
import { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SmoothAppearProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function SmoothAppear({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = 'up'
}: SmoothAppearProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const variants = {
    up: { y: 30, opacity: 0 },
    down: { y: -30, opacity: 0 },
    left: { x: 30, opacity: 0 },
    right: { x: -30, opacity: 0 }
  };

  const animate = {
    y: direction === 'up' ? 0 : direction === 'down' ? 0 : undefined,
    x: direction === 'left' ? 0 : direction === 'right' ? 0 : undefined,
    opacity: 1
  };

  return (
    <motion.div
      ref={ref}
      initial={variants[direction]}
      animate={isInView ? animate : variants[direction]}
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
