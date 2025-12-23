import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

// Créer le middleware next-intl
const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // D'abord, appliquer le middleware i18n pour détecter/rediriger vers la bonne locale
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
  // Matcher pour toutes les routes sauf les fichiers statiques et les routes API internes
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
