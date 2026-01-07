import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { LocaleSelector } from '../locale-selector';

export default function Header() {
  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 pr-4 pl-12 md:pl-4'>
        <SidebarTrigger className='-ml-1 hidden md:flex' />
        <Separator
          orientation='vertical'
          className='mr-2 hidden h-4 md:block'
        />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <LocaleSelector />
      </div>
    </header>
  );
}
