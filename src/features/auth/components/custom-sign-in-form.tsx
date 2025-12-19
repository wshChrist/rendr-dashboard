'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  IconLoader2,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react';
import Link from 'next/link';
import GoogleSignInButton from './google-auth-button';
import GithubSignInButton from './github-auth-button';

const signInSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function CustomSignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: SignInFormValues) => {
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success('Connexion réussie !');
        router.push('/dashboard/overview');
      } else {
        // Gérer les cas où une vérification est nécessaire
        setPendingVerification(true);
        toast.info('Vérification requise');
      }
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.message ||
        'Une erreur est survenue lors de la connexion';
      toast.error(errorMessage);
      form.setError('root', { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className='space-y-4'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold'>Vérification requise</h3>
          <p className='text-muted-foreground mt-2 text-sm'>
            Veuillez vérifier votre email pour continuer
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='space-y-5'
    >
      <FormField
        control={form.control}
        name='email'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <div className='relative'>
                <IconMail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  {...field}
                  type='email'
                  placeholder='votre@email.com'
                  className='pl-10'
                  disabled={isLoading}
                  autoComplete='email'
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='password'
        render={({ field }) => (
          <FormItem>
            <div className='flex items-center justify-between'>
              <FormLabel>Mot de passe</FormLabel>
              <Link
                href='/auth/forgot-password'
                className='text-primary hover:text-primary/80 text-sm underline-offset-4 hover:underline'
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <FormControl>
              <div className='relative'>
                <IconLock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  className='pr-10 pl-10'
                  disabled={isLoading}
                  autoComplete='current-password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors'
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <IconEyeOff className='h-4 w-4' />
                  ) : (
                    <IconEye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.formState.errors.root && (
        <div className='bg-destructive/10 border-destructive/20 rounded-md border p-3'>
          <p className='text-destructive text-sm'>
            {form.formState.errors.root.message}
          </p>
        </div>
      )}

      <Button
        type='submit'
        className='w-full'
        size='lg'
        disabled={isLoading || !isLoaded}
      >
        {isLoading ? (
          <>
            <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
            Connexion en cours...
          </>
        ) : (
          'Se connecter'
        )}
      </Button>

      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-card text-muted-foreground px-2'>
            Ou continuer avec
          </span>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <GoogleSignInButton />
        <GithubSignInButton />
      </div>

      <div className='text-center text-sm'>
        <span className='text-muted-foreground'>Pas encore de compte ? </span>
        <Link
          href='/auth/sign-up'
          className='text-primary hover:text-primary/80 font-medium underline-offset-4 transition-colors hover:underline'
          style={{ viewTransitionName: 'auth-link' } as React.CSSProperties}
        >
          Créer un compte
        </Link>
      </div>
    </Form>
  );
}
