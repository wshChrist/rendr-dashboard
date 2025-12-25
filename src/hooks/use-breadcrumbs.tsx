'use client';

import { usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

export function useBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations();

  const breadcrumbs = useMemo(() => {
    // Mapping des routes aux clés de traduction
    const routeTranslationMap: Record<string, string> = {
      dashboard: t('breadcrumbs.dashboard'),
      overview: t('breadcrumbs.overview'),
      transactions: t('breadcrumbs.transactions'),
      brokers: t('breadcrumbs.brokers'),
      'my-brokers': t('breadcrumbs.myBrokers'),
      withdrawals: t('breadcrumbs.withdrawals'),
      referral: t('breadcrumbs.referral'),
      profile: t('breadcrumbs.profile'),
      updates: t('breadcrumbs.updates')
    };

    // Si on a un mapping exact pour ce path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      // Utiliser la traduction si disponible, sinon capitaliser le segment
      const title =
        routeTranslationMap[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      return {
        title,
        link: path
      };
    });
  }, [pathname, t]);

  return breadcrumbs;
}
