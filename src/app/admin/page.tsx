import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getZones, getSettings, getUsers } from '@/lib/actions';
import { redirect } from 'next/navigation';


export const dynamic = 'force-dynamic';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const userId = searchParams?.userId;

  if (typeof userId !== 'string') {
    redirect('/login');
  }

  const zones = await getZones();
  const settings = await getSettings();
  const users = await getUsers();

  return (
    <div className="container mx-auto py-8 px-4">
      <AdminDashboard initialZones={zones} initialSettings={settings} initialUsers={users} />
    </div>
  );
}
