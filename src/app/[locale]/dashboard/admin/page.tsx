import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard : Administration'
};

export default async function AdminPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/admin/overview`);
}
