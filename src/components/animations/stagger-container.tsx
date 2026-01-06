'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  duration = 0.5
}: StaggerContainerProps) {
  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1
          }
        }
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function StaggerItem({
  children,
  className,
  duration = 0.5
}: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration,
            ease: [0.4, 0, 0.2, 1]
          }
        }
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
