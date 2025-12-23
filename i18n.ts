import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ requestLocale }) => {
  // Cette fonction sera appelée pour chaque requête
  // requestLocale est déterminé par le middleware
  let locale = await requestLocale;

  // Liste des locales supportées
  const locales = ['fr', 'en'];
  const defaultLocale = 'fr';

  // Assurez-vous que la locale est valide
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
