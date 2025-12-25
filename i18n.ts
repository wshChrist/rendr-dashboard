import { getRequestConfig } from 'next-intl/server';
import { routing } from './src/i18n/routing';

/**
 * Deep merge function to combine translation objects
 * English (fallback) values are used when translation is missing
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Cette fonction sera appelée pour chaque requête
  // requestLocale est déterminé par le middleware
  let locale = await requestLocale;

  // Assurez-vous que la locale est valide
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Charger l'anglais comme fallback (source de vérité)
  const fallbackMessages = await import(`./messages/en.json`).then(
    (m) => m.default
  );

  // Charger la langue demandée
  let localeMessages;
  try {
    localeMessages = await import(`./messages/${locale}.json`).then(
      (m) => m.default
    );
  } catch (error) {
    // Si le fichier n'existe pas, utiliser seulement l'anglais
    localeMessages = {};
  }

  // Fusionner : langue demandée en priorité, anglais en fallback
  // Cela permet d'avoir toujours une traduction même si une clé manque
  const messages = deepMerge(fallbackMessages, localeMessages);

  return {
    locale,
    messages
  };
});
