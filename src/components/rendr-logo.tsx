'use client';

import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import Link from 'next/link';

export function RendRLogo() {
  const { state } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link href='/dashboard/overview' className='group'>
            <div className='relative flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-105'>
              <img
                src='/logo.png'
                alt='RendR Logo'
                width={32}
                height={32}
                className='relative size-8 object-contain transition-transform duration-300 group-hover:scale-110'
              />
            </div>
            <div
              className={`grid flex-1 text-left text-sm leading-tight transition-all duration-300 ease-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 overflow-hidden opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            >
              <span className='truncate text-lg font-bold tracking-tight transition-all duration-300 group-hover:tracking-wider'>
                Rend
                <span className='text-white transition-all duration-300 group-hover:text-white/80'>
                  R
                </span>
              </span>
              <span className='text-muted-foreground group-hover:text-foreground/70 truncate text-xs transition-colors duration-300'>
                Cashback Traders
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
