'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  liftAmount?: number;
  scale?: number;
}

export function HoverLift({
  children,
  className,
  liftAmount = -4,
  scale = 1.02
}: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{
        y: liftAmount,
        scale,
        transition: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }
      }}
      whileTap={{
        scale: 0.98,
        transition: {
          duration: 0.1
        }
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
