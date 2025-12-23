import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/lib/font';
import ThemeProvider from '@/components/layout/ThemeToggle/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';
import '../theme.css';

// Couleurs RendR
const META_THEME_COLORS = {
  light: '#fafafa',
  dark: '#0a0a0f' // Fond sombre RendR
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  const messages = await getMessages({ locale });

  return {
    title: (messages.metadata as any)?.title || 'RendR - Cashback Traders',
    description:
      (messages.metadata as any)?.description ||
      'Récupérez une partie de vos frais de trading grâce à notre partenariat IB avec des brokers régulés.'
  };
}

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.dark
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Valider que la locale est supportée
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Charger les messages pour la locale
  const messages = await getMessages({ locale });

  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value || 'rendr';
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          'bg-background overflow-hidden overscroll-none font-sans antialiased',
          activeThemeValue ? `theme-${activeThemeValue}` : 'theme-rendr',
          isScaled ? 'theme-scaled' : '',
          fontVariables
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <NextTopLoader color='#ffffff' showSpinner={false} />
          <NuqsAdapter>
            <ThemeProvider
              attribute='class'
              defaultTheme='dark'
              enableSystem={false}
              disableTransitionOnChange
              enableColorScheme
            >
              <Providers activeThemeValue={activeThemeValue as string}>
                <Toaster />
                {children}
              </Providers>
            </ThemeProvider>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
