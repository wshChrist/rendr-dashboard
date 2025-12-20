'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navItems } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavItems } from '@/hooks/use-nav';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { RendRLogo } from '../rendr-logo';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  };
  const filteredItems = useFilteredNavItems(navItems);
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <RendRLogo />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarMenu>
            {filteredItems.map((item, index) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const hasSubItems = item?.items && item?.items?.length > 0;
              const isActiveParent = item.items?.some(
                (subItem) => pathname === subItem.url
              );

              // Si le menu a des sous-éléments
              if (hasSubItems) {
                // Mode collapsed : utiliser DropdownMenu
                if (isCollapsed) {
                  return (
                    <SidebarMenuItem
                      key={item.title}
                      className='animate-fade-in-up opacity-0'
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActiveParent}
                            className='group transition-all duration-200'
                          >
                            {item.icon && (
                              <Icon className='transition-transform duration-200 group-hover:scale-110' />
                            )}
                            <span>{item.title}</span>
                            <IconChevronRight className='ml-auto transition-transform duration-200' />
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side='right'
                          align='start'
                          sideOffset={8}
                          className='min-w-48'
                        >
                          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {item.items?.map((subItem) => (
                            <DropdownMenuItem
                              key={subItem.title}
                              asChild
                              className={
                                pathname === subItem.url ? 'bg-accent' : ''
                              }
                            >
                              <Link
                                href={subItem.url}
                                className='cursor-pointer'
                              >
                                {subItem.title}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                }

                // Mode expanded : utiliser Collapsible
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive || isActiveParent}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem
                      className='animate-fade-in-up opacity-0'
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isActiveParent}
                          className='group transition-all duration-200 hover:translate-x-1'
                        >
                          {item.icon && (
                            <Icon className='transition-transform duration-200 group-hover:scale-110' />
                          )}
                          <span>{item.title}</span>
                          <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                                className='transition-all duration-200 hover:translate-x-1'
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              // Menu sans sous-éléments
              return (
                <SidebarMenuItem
                  key={item.title}
                  className='animate-fade-in-up opacity-0'
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    className='group transition-all duration-200 hover:translate-x-1'
                  >
                    <Link href={item.url}>
                      <Icon className='transition-transform duration-200 group-hover:scale-110' />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/withdrawals')}
                  >
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    Retraits
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconBell className='mr-2 h-4 w-4' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <IconLogout className='mr-2 h-4 w-4' />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
