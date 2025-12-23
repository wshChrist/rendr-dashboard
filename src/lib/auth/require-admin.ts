import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

function getUserRole(user: { user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  const role = metadata.role;
  return typeof role === 'string' ? role : undefined;
}

/**
 * Protection côté pages (Server Components).
 * - Redirige vers /auth/sign-in si non connecté
 * - Redirige vers /dashboard/overview si pas admin
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/sign-in');
  }

  if (getUserRole(user) !== 'admin') {
    redirect('/dashboard/overview');
  }

  return { supabase, user };
}

/**
 * Protection côté routes API.
 */
export async function assertAdminApi() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Non autorisé', message: 'Vous devez être connecté' },
        { status: 401 }
      )
    };
  }

  if (getUserRole(user) !== 'admin') {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: 'Accès interdit',
          message: "Vous n'avez pas les droits administrateur"
        },
        { status: 403 }
      )
    };
  }

  return { ok: true as const, user, supabase };
}

