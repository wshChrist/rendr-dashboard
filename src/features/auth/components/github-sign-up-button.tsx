'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

export default function GithubSignUpButton() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard/overview';
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createSupabaseClient();

  const handleGithubSignUp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/sign-up/sso-callback?redirect=${encodeURIComponent(callbackUrl)}`
        }
      });

      if (error) {
        throw error;
      }
      // La redirection se fait automatiquement
    } catch (error: any) {
      console.error("Erreur lors de l'inscription GitHub:", error);
      const errorMessage = error?.message || t('auth.oauth.github.signUpError');
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <Button
      className='w-full'
      variant='outline'
      type='button'
      onClick={handleGithubSignUp}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
          {t('auth.oauth.github.signingUp')}
        </>
      ) : (
        <>
          <Icons.github className='mr-2 h-4 w-4' />
          {t('auth.oauth.github.continueWith')}
        </>
      )}
    </Button>
  );
}
