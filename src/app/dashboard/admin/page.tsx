import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard : Administration'
};

export default function AdminPage() {
  redirect('/dashboard/admin/overview');
}

