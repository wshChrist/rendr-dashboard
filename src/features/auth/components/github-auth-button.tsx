'use client';

import { useSignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function GithubSignInButton() {
  const { isLoaded, signIn } = useSignIn();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard/overview';
  const [isLoading, setIsLoading] = useState(false);

  const handleGithubSignIn = async () => {
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_github',
        redirectUrl: '/auth/sign-in/sso-callback',
        redirectUrlComplete: callbackUrl
      });
    } catch (error: any) {
      console.error('Erreur lors de la connexion GitHub:', error);
      const errorMessage =
        error?.errors?.[0]?.message ||
        'Une erreur est survenue lors de la connexion avec GitHub';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <Button
      className='w-full'
      variant='outline'
      type='button'
      onClick={handleGithubSignIn}
      disabled={!isLoaded || isLoading}
    >
      {isLoading ? (
        <>
          <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
          Connexion...
        </>
      ) : (
        <>
          <Icons.github className='mr-2 h-4 w-4' />
          Continuer avec GitHub
        </>
      )}
    </Button>
  );
}
