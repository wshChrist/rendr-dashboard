'use client';

import { IconTrendingUp, IconShield, IconChartLine } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';
import { CustomSignUpForm } from './custom-sign-up-form';
import { motion } from 'motion/react';

export default function SignUpViewPage({ stars }: { stars: number }) {
  return (
    <div className='bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden'>
      {/* Background decorative elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='bg-primary/5 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl' />
        <div className='bg-primary/5 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl' />
        <div className='bg-primary/3 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl' />
      </div>

      {/* Main content */}
      <div className='relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid min-h-screen lg:grid-cols-2 lg:gap-8 lg:py-8'>
          {/* Left side - Branding */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className='border-border/50 from-card via-card to-card/50 relative my-8 hidden flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-12 backdrop-blur-sm lg:flex'
          >
            {/* Animated background gradient */}
            <div className='from-primary/5 to-primary/10 absolute inset-0 bg-gradient-to-br via-transparent' />

            {/* Subtle grid pattern */}
            <div className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05]'>
              <InteractiveGridPattern
                squares={[15, 15]}
                className='h-full w-full'
                squaresClassName='stroke-foreground'
              />
            </div>

            {/* Animated orbs */}
            <div className='bg-primary/10 absolute top-20 right-20 h-32 w-32 animate-pulse rounded-full blur-3xl' />
            <div
              className='bg-primary/5 absolute bottom-32 left-16 h-24 w-24 animate-pulse rounded-full blur-2xl'
              style={{ animationDelay: '1s' }}
            />

            {/* Content */}
            <div className='relative z-10 flex h-full flex-col'>
              {/* Logo */}
              <div className='mb-16'>
                <div className='mb-2 flex items-center gap-4'>
                  <div className='from-primary/20 to-primary/10 border-primary/20 relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-lg'>
                    <Image
                      src='/logo.png'
                      alt='RendR Logo'
                      width={36}
                      height={36}
                      className='h-9 w-9 object-contain'
                      suppressHydrationWarning
                    />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-3xl font-bold tracking-tight'>
                      Rend<span className='text-primary'>R</span>
                    </span>
                    <span className='text-muted-foreground text-sm font-medium'>
                      Cashback Traders
                    </span>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className='flex-1 space-y-10'>
                <div className='space-y-4'>
                  <h2 className='text-4xl leading-tight font-bold tracking-tight'>
                    Rejoignez <span className='text-primary'>RendR</span>
                  </h2>
                  <p className='text-muted-foreground max-w-md text-lg leading-relaxed'>
                    Créez votre compte et commencez à gagner du cashback sur
                    chaque transaction. Rejoignez une communauté de traders qui
                    maximisent leurs gains.
                  </p>
                </div>

                {/* Feature cards */}
                <div className='space-y-4'>
                  <div className='group border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card/70 relative rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg'>
                    <div className='flex items-start gap-4'>
                      <div className='from-primary/20 to-primary/10 border-primary/20 mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-110'>
                        <IconTrendingUp className='text-primary h-6 w-6' />
                      </div>
                      <div className='flex-1 space-y-1'>
                        <h3 className='text-base font-semibold'>
                          Cashback sur chaque trade
                        </h3>
                        <p className='text-muted-foreground text-sm leading-relaxed'>
                          Recevez un pourcentage de cashback sur toutes vos
                          transactions réussies.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='group border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card/70 relative rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg'>
                    <div className='flex items-start gap-4'>
                      <div className='from-primary/20 to-primary/10 border-primary/20 mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-110'>
                        <IconChartLine className='text-primary h-6 w-6' />
                      </div>
                      <div className='flex-1 space-y-1'>
                        <h3 className='text-base font-semibold'>
                          Analytics avancés
                        </h3>
                        <p className='text-muted-foreground text-sm leading-relaxed'>
                          Suivez vos performances en temps réel avec des
                          tableaux de bord détaillés.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='group border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card/70 relative rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg'>
                    <div className='flex items-start gap-4'>
                      <div className='from-primary/20 to-primary/10 border-primary/20 mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-110'>
                        <IconShield className='text-primary h-6 w-6' />
                      </div>
                      <div className='flex-1 space-y-1'>
                        <h3 className='text-base font-semibold'>
                          Sécurité maximale
                        </h3>
                        <p className='text-muted-foreground text-sm leading-relaxed'>
                          Vos données et transactions sont protégées par les
                          meilleures pratiques de sécurité.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className='border-border/50 relative z-10 border-t pt-8'>
                <p className='text-muted-foreground text-sm font-medium'>
                  Rejoignez des milliers de traders qui font confiance à RendR
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right side - Sign Up Form */}
          <div className='flex h-full min-h-screen flex-col items-center justify-center p-4 sm:p-8 lg:min-h-0 lg:justify-center'>
            <motion.div
              key='sign-up'
              initial={{ opacity: 0, x: 30, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className='w-full max-w-md space-y-8'
            >
              {/* Mobile Logo */}
              <div className='flex items-center justify-center gap-3 lg:hidden'>
                <div className='bg-primary/10 relative flex h-12 w-12 items-center justify-center rounded-xl'>
                  <Image
                    src='/logo.png'
                    alt='RendR Logo'
                    width={32}
                    height={32}
                    className='h-8 w-8 object-contain'
                    suppressHydrationWarning
                  />
                </div>
                <div className='flex flex-col'>
                  <span className='text-2xl font-bold tracking-tight'>
                    Rend<span className='text-primary'>R</span>
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    Cashback Traders
                  </span>
                </div>
              </div>

              {/* Sign Up Form */}
              <div className='space-y-6'>
                <div className='text-center lg:text-left'>
                  <h1 className='text-center text-3xl font-bold tracking-tight lg:text-left'>
                    Créer un compte
                  </h1>
                  <p className='text-muted-foreground mt-2 text-center lg:text-left'>
                    Créez votre compte pour commencer à trader avec cashback
                  </p>
                </div>

                <div className='border-border bg-card rounded-xl border p-6 shadow-sm'>
                  <CustomSignUpForm />
                </div>

                {/* Terms */}
                <p className='text-muted-foreground text-center text-xs'>
                  En continuant, vous acceptez nos{' '}
                  <Link
                    href='/terms'
                    className='hover:text-primary underline underline-offset-4'
                  >
                    Conditions d&apos;utilisation
                  </Link>{' '}
                  et notre{' '}
                  <Link
                    href='/privacy'
                    className='hover:text-primary underline underline-offset-4'
                  >
                    Politique de confidentialité
                  </Link>
                  .
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
