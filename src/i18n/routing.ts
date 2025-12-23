import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // Liste des langues supportées
  locales: ['fr', 'en'],

  // Langue par défaut
  defaultLocale: 'fr',

  // Détection automatique de la langue du navigateur
  localeDetection: true
});

// Export des helpers de navigation
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
