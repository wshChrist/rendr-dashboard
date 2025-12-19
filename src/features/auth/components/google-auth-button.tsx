'use client';

import { useSignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function GoogleSignInButton() {
  const { isLoaded, signIn } = useSignIn();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard/overview';
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isLoaded) {
      toast.error("Clerk n'est pas encore chargé. Veuillez patienter...");
      return;
    }

    if (!signIn) {
      toast.error("Erreur: Impossible d'accéder au service de connexion");
      return;
    }

    setIsLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/auth/sign-in/sso-callback',
        redirectUrlComplete: callbackUrl
      });
      // Note: setIsLoading(false) n'est pas nécessaire ici car la redirection va se produire
    } catch (error: any) {
      console.error('Erreur lors de la connexion Google:', error);
      const errorMessage =
        error?.errors?.[0]?.message ||
        'Une erreur est survenue lors de la connexion avec Google';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <Button
      className='w-full'
      variant='outline'
      type='button'
      onClick={handleGoogleSignIn}
      disabled={!isLoaded || isLoading}
    >
      {isLoading ? (
        <>
          <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
          Connexion...
        </>
      ) : (
        <>
          <Icons.google className='mr-2 h-4 w-4' />
          Continuer avec Google
        </>
      )}
    </Button>
  );
}
