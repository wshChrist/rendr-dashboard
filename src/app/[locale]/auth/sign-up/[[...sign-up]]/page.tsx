import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t('auth.signUp.pageTitle')} | RendR`,
    description: t('auth.signUp.pageDescription')
  };
}

export default async function Page() {
  // Paramètre stars conservé pour compatibilité mais non utilisé dans le nouveau design
  return <SignUpViewPage stars={0} />;
}
