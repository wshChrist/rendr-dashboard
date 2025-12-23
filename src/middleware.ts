import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

// Créer le middleware next-intl
const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Exclure les routes API de next-intl (elles ne doivent pas avoir de préfixe de locale)
  if (pathname.startsWith('/api/')) {
    // Pour les routes API, on applique seulement le middleware Supabase
    return await updateSession(request);
  }

  // Pour les autres routes, appliquer le middleware i18n pour détecter/rediriger vers la bonne locale
  const intlResponse = intlMiddleware(request);

  // Si next-intl a fait une redirection (pour ajouter la locale), on la retourne directement
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // Ensuite, gérer l'authentification Supabase
  // La requête passée à updateSession contient déjà la locale dans le pathname
  // car next-intl l'a déjà traitée (même s'il n'a pas redirigé)
  const supabaseResponse = await updateSession(request);

  // Si Supabase a fait une redirection, la retourner
  // Sinon, retourner la réponse d'intl (qui contient les headers nécessaires)
  return supabaseResponse.status === 307 || supabaseResponse.status === 308
    ? supabaseResponse
    : intlResponse;
}

export const config = {
  // Matcher pour toutes les routes sauf les fichiers statiques
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    // Note: Les routes API sont incluses pour le middleware Supabase, mais exclues de next-intl
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
};
