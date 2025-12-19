import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Inscription | RendR',
  description:
    'Créez votre compte RendR pour accéder à votre dashboard de trading avec cashback.'
};

export default async function Page() {
  // Paramètre stars conservé pour compatibilité mais non utilisé dans le nouveau design
  return <SignUpViewPage stars={0} />;
}
