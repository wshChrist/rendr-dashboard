import { createBrowserClient } from '@supabase/ssr';

// Client Supabase pour le frontend (utilise les cookies pour la synchronisation avec le middleware)
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
