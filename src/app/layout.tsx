import { fontVariables } from '@/lib/font';
import { cn } from '@/lib/utils';
import { cookies } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import './theme.css';

// Layout racine - Next.js exige que les balises <html> et <body> soient présentes
// Le layout principal avec toute la logique se trouve dans [locale]/layout.tsx
export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const activeThemeValue =
    cookieStore.get('active_theme')?.value || 'default-scaled';
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <html suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          'bg-background overflow-hidden overscroll-none font-sans antialiased',
          activeThemeValue ? `theme-${activeThemeValue}` : 'theme-rendr',
          isScaled ? 'theme-scaled' : '',
          fontVariables
        )}
      >
        <Script
          id='theme-color-script'
          strategy='beforeInteractive'
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0a0a0f')
                }
              } catch (_) {}
            `
          }}
        />
        {children}
      </body>
    </html>
  );
}
