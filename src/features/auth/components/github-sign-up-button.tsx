'use client';

import { useSignUp } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function GithubSignUpButton() {
  const { isLoaded, signUp } = useSignUp();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard/overview';
  const [isLoading, setIsLoading] = useState(false);

  const handleGithubSignUp = async () => {
    if (!isLoaded || !signUp) return;

    setIsLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_github',
        redirectUrl: '/auth/sign-up/sso-callback',
        redirectUrlComplete: callbackUrl
      });
    } catch (error: any) {
      console.error("Erreur lors de l'inscription GitHub:", error);
      const errorMessage =
        error?.errors?.[0]?.message ||
        "Une erreur est survenue lors de l'inscription avec GitHub";
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
      disabled={!isLoaded || isLoading}
    >
      {isLoading ? (
        <>
          <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
          Inscription...
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
