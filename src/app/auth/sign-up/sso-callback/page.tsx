'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { IconLoader2 } from '@tabler/icons-react';

export default function SSOCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          const redirect =
            searchParams.get('redirect') || '/dashboard/overview';
          toast.success('Inscription réussie !');
          router.push(redirect);
        } else {
          toast.error("Erreur lors de l'inscription");
          router.push('/auth/sign-up');
        }
      } catch (error: any) {
        console.error('Erreur callback SSO:', error);
        toast.error(error.message || "Erreur lors de l'inscription");
        router.push('/auth/sign-up');
      }
    };

    handleCallback();
  }, [router, searchParams, supabase]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <IconLoader2 className='text-primary mx-auto h-8 w-8 animate-spin' />
        <p className='text-muted-foreground mt-4'>Inscription en cours...</p>
      </div>
    </div>
  );
}
