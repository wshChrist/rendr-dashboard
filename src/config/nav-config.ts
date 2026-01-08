import { NavItem } from '@/types';

/**
 * Configuration de navigation pour la plateforme de cashback traders
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 */
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Transactions',
    url: '/dashboard/transactions',
    icon: 'transactions',
    isActive: false,
    shortcut: ['t', 't'],
    items: []
  },
  {
    title: 'Brokers',
    url: '/dashboard/brokers',
    icon: 'brokers',
    isActive: true,
    shortcut: ['b', 'b'],
    items: [
      {
        title: 'Mes Comptes',
        url: '/dashboard/brokers/my-brokers',
        icon: 'profile',
        shortcut: ['b', 'm']
      },
      {
        title: 'Brokers Partenaires',
        url: '/dashboard/brokers/available',
        icon: 'brokers',
        shortcut: ['b', 'p']
      }
    ]
  },
  {
    title: 'Retraits',
    url: '/dashboard/withdrawals',
    icon: 'withdrawals',
    isActive: false,
    shortcut: ['r', 'r'],
    items: []
  },
  {
    title: 'Parrainage',
    url: '/dashboard/referral',
    icon: 'referral',
    isActive: false,
    shortcut: ['p', 'p'],
    items: []
  },
  {
    title: 'Nouveautés',
    url: '/dashboard/updates',
    icon: 'updates',
    isActive: false,
    shortcut: ['n', 'n'],
    items: []
  },
  {
    title: 'Administration',
    url: '/dashboard/admin',
    icon: 'settings',
    isActive: false,
    shortcut: ['a', 'a'],
    access: { role: 'admin' },
    items: [
      {
        title: "Vue d'ensemble",
        url: '/dashboard/admin/overview',
        icon: 'dashboard',
        shortcut: ['a', 'v'],
        access: { role: 'admin' }
      },
      {
        title: 'Espace de travail',
        url: '#',
        icon: 'dashboard',
        shortcut: ['a', 'w'],
        access: { role: 'admin' },
        items: [
          {
            title: 'Objectifs',
            url: '/dashboard/admin/goals',
            icon: 'dashboard',
            shortcut: ['a', 'g'],
            access: { role: 'admin' }
          },
          {
            title: 'Calendrier',
            url: '/dashboard/admin/calendar',
            icon: 'updates',
            shortcut: ['a', 'l'],
            access: { role: 'admin' }
          },
          {
            title: 'Documents',
            url: '/dashboard/admin/documents',
            icon: 'transactions',
            shortcut: ['a', 'd'],
            access: { role: 'admin' }
          }
        ]
      },
      {
        title: 'Gestion',
        url: '#',
        icon: 'settings',
        shortcut: ['a', 'm'],
        access: { role: 'admin' },
        items: [
          {
            title: 'Utilisateurs',
            url: '/dashboard/admin/users',
            icon: 'users',
            shortcut: ['a', 'u'],
            access: { role: 'admin' }
          },
          {
            title: 'Retraits',
            url: '/dashboard/admin/withdrawals',
            icon: 'withdrawals',
            shortcut: ['a', 'r'],
            access: { role: 'admin' }
          },
          {
            title: 'Brokers',
            url: '/dashboard/admin/brokers',
            icon: 'brokers',
            shortcut: ['a', 'b'],
            access: { role: 'admin' }
          },
          {
            title: 'Comptes',
            url: '/dashboard/admin/accounts',
            icon: 'profile',
            shortcut: ['a', 'c'],
            access: { role: 'admin' }
          }
        ]
      }
    ]
  },
  {
    title: 'Compte',
    url: '#',
    icon: 'account',
    isActive: true,
    items: [
      {
        title: 'Profil',
        url: '/dashboard/profile',
        icon: 'profile',
        shortcut: ['m', 'm']
      },
      {
        title: 'Déconnexion',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'logout'
      }
    ]
  }
];
