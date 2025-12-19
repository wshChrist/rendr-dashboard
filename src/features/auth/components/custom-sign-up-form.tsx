'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
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
import GoogleSignUpButton from './google-sign-up-button';
import GithubSignUpButton from './github-sign-up-button';

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
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

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
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName
      });

      // Envoyer l'email de vérification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
      toast.info('Vérifiez votre email pour continuer');
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.message ||
        'Une erreur est survenue lors de la création du compte';
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
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='firstName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder='Jean'
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
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder='Dupont'
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
            <FormLabel>Mot de passe</FormLabel>
            <FormControl>
              <div className='relative'>
                <IconLock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  className='pr-10 pl-10'
                  disabled={isLoading}
                  autoComplete='new-password'
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
            Création en cours...
          </>
        ) : (
          'Créer mon compte'
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
        <GoogleSignUpButton />
        <GithubSignUpButton />
      </div>

      <div className='text-center text-sm'>
        <span className='text-muted-foreground'>Déjà un compte ? </span>
        <Link
          href='/auth/sign-in'
          className='text-primary hover:text-primary/80 font-medium underline-offset-4 transition-colors hover:underline'
          style={{ viewTransitionName: 'auth-link' } as React.CSSProperties}
        >
          Se connecter
        </Link>
      </div>
    </Form>
  );
}
