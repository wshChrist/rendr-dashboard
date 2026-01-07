import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t('auth.signIn.pageTitle')} | RendR`,
    description: t('auth.signIn.description')
  };
}

export default async function Page() {
  // Paramètre stars conservé pour compatibilité mais non utilisé dans le nouveau design
  return <SignInViewPage stars={0} />;
}
