import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard : Brokers'
};

export default function BrokersPage() {
  // Redirige vers la page "Mes Comptes" par défaut
  redirect('/dashboard/brokers/my-brokers');
}
