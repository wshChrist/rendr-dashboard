import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Connexion | RendR',
  description:
    'Connectez-vous à votre compte RendR pour accéder à votre dashboard de trading avec cashback.'
};

export default async function Page() {
  // Paramètre stars conservé pour compatibilité mais non utilisé dans le nouveau design
  return <SignInViewPage stars={0} />;
}
