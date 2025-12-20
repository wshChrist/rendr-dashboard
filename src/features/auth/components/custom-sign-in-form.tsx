'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
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

const signInSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function CustomSignInForm() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        throw error;
      }

      if (authData.user && authData.session) {
        toast.success('Connexion réussie !');
        // Attendre un court instant pour que les cookies soient sauvegardés
        await new Promise((resolve) => setTimeout(resolve, 200));
        // Rafraîchir le routeur pour que le middleware détecte la session
        router.refresh();
        // Rediriger vers le dashboard
        router.push('/dashboard/overview');
      } else if (authData.user) {
        // Si pas de session immédiatement, attendre un peu
        toast.success('Connexion réussie !');
        setTimeout(async () => {
          const {
            data: { session }
          } = await supabase.auth.getSession();
          if (session) {
            router.refresh();
            router.push('/dashboard/overview');
          } else {
            toast.error('Erreur de session. Veuillez réessayer.');
          }
        }, 500);
      }
    } catch (err: any) {
      const errorMessage =
        err.message || 'Une erreur est survenue lors de la connexion';
      toast.error(errorMessage);
      form.setError('root', { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

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
              <div className='relative' suppressHydrationWarning>
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
              <div className='relative' suppressHydrationWarning>
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
                  suppressHydrationWarning
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

      <Button type='submit' className='w-full' size='lg' disabled={isLoading}>
        {isLoading ? (
          <>
            <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
            Connexion en cours...
          </>
        ) : (
          'Se connecter'
        )}
      </Button>

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
