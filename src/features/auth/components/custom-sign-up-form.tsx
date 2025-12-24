'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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

const signUpSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis')
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function CustomSignUpForm() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    }
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: `${data.firstName} ${data.lastName}`,
            first_name: data.firstName,
            last_name: data.lastName
          }
        }
      });

      if (error) {
        throw error;
      }

      if (authData.user && authData.session) {
        // Confirmation d'email désactivée, connexion directe
        toast.success(t('auth.signUp.accountCreated'));
        // Attendre un court instant pour que les cookies soient sauvegardés
        await new Promise((resolve) => setTimeout(resolve, 200));
        // Rafraîchir le routeur pour que le middleware détecte la session
        router.refresh();
        // Rediriger vers le dashboard
        router.push('/dashboard/overview');
      } else if (authData.user) {
        // Si pas de session immédiatement, attendre un peu
        toast.success(t('auth.signUp.accountCreated'));
        setTimeout(async () => {
          const {
            data: { session }
          } = await supabase.auth.getSession();
          if (session) {
            router.refresh();
            router.push('/dashboard/overview');
          } else {
            toast.error(t('auth.signUp.sessionError'));
          }
        }, 500);
      }
    } catch (err: any) {
      const errorMessage =
        err.message || 'Une erreur est survenue lors de la création du compte';
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
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='firstName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.signUp.firstName')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('auth.signUp.firstNamePlaceholder')}
                  disabled={isLoading}
                  autoComplete='given-name'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='lastName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.signUp.lastName')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('auth.signUp.lastNamePlaceholder')}
                  disabled={isLoading}
                  autoComplete='family-name'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='email'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('auth.signUp.email')}</FormLabel>
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
            <FormLabel>{t('auth.signUp.password')}</FormLabel>
            <FormControl>
              <div className='relative' suppressHydrationWarning>
                <IconLock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.signUp.passwordPlaceholder')}
                  className='pr-10 pl-10'
                  disabled={isLoading}
                  autoComplete='new-password'
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
            {t('auth.signUp.creatingAccount')}
          </>
        ) : (
          t('auth.signUp.createAccount')
        )}
      </Button>

      <div className='text-center text-sm'>
        <span className='text-muted-foreground'>{t('auth.signUp.alreadyHaveAccount')} </span>
        <Link
          href='/auth/sign-in'
          className='text-primary hover:text-primary/80 font-medium underline-offset-4 transition-colors hover:underline'
          style={{ viewTransitionName: 'auth-link' } as React.CSSProperties}
        >
          {t('auth.signIn.signInButton')}
        </Link>
      </div>
    </Form>
  );
}

