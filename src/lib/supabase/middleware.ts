import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Exclure les routes API de l'EA du middleware (pas besoin d'authentification)
  const requestPathname = request.nextUrl.pathname;

  // Routes publiques pour l'EA (pas d'authentification requise)
  if (
    requestPathname.startsWith('/api/trades/register') ||
    (requestPathname.startsWith('/api/trades') &&
      requestPathname !== '/api/trades/register') ||
    requestPathname.startsWith('/api/test')
  ) {
    // Ces routes sont publiques et ne nécessitent pas d'authentification
    console.log(
      'Route API EA détectée, bypass du middleware:',
      requestPathname
    );
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    });
  }

  // Pour /api/trading-accounts, on laisse passer mais l'authentification sera vérifiée dans la route
  if (requestPathname.startsWith('/api/trading-accounts')) {
    // Cette route vérifie l'authentification elle-même
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Variables Supabase manquantes:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    });
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options
        });
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        response.cookies.set({
          name,
          value,
          ...options
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options
        });
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        response.cookies.set({
          name,
          value: '',
          ...options
        });
      }
    }
  });

  // Mettre à jour la session (cela met à jour les cookies automatiquement)
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Extraire la locale de l'URL (format: /fr/... ou /en/...)
  const currentPathname = request.nextUrl.pathname;
  const localeMatch = currentPathname.match(/^\/(fr|en)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : 'fr'; // Par défaut 'fr' si pas de locale

  // Protéger les routes /dashboard (avec locale)
  if (currentPathname.startsWith(`/${locale}/dashboard`) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/sign-in`;
    return NextResponse.redirect(url);
  }

  // Rediriger les utilisateurs connectés depuis /auth vers /dashboard (avec locale)
  if (
    (currentPathname.startsWith(`/${locale}/auth/sign-in`) ||
      currentPathname.startsWith(`/${locale}/auth/sign-up`)) &&
    user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard/overview`;
    return NextResponse.redirect(url);
  }

  return response;
}
