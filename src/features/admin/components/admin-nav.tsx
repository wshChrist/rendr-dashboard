'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { title: 'Vue d’ensemble', href: '/dashboard/admin/overview' },
  { title: 'Retraits', href: '/dashboard/admin/withdrawals' },
  { title: 'Brokers', href: '/dashboard/admin/brokers' }
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {adminNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              'bg-zinc-900/30 backdrop-blur-sm',
              isActive
                ? 'border-[#c5d13f]/30 bg-[#c5d13f]/10 text-[#c5d13f]'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </div>
  );
}

