
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getZones, getSettings, getUsers, getUserById } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';


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

  let decodedUserId;
  try {
    decodedUserId = Buffer.from(userId, 'base64').toString('utf-8');
  } catch (e) {
    console.error("Failed to decode userId:", e);
    redirect('/login');
  }

  const adminUser = await getUserById(decodedUserId);

  // Ensure the user exists and has the admin role
  if (!adminUser || adminUser.role !== 'admin') {
      redirect('/login');
  }

  const zones = await getZones();
  const settings = await getSettings();
  const users = await getUsers();

  return (
    <>
      <Header section="Admin" userId={userId} />
      <div className="container mx-auto py-8 px-4">
        <AdminDashboard initialZones={zones} initialSettings={settings} initialUsers={users} />
      </div>
    </>
  );
}
