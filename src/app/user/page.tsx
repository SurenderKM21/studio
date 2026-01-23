
import { UserDashboard } from '@/components/user/user-dashboard';
import { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { getZones, getSettings, getUserById } from '@/lib/actions';

export const dynamic = 'force-dynamic';


export default async function UserPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const userId = searchParams?.userId;

  if (typeof userId !== 'string') {
    redirect('/login');
  }

  const user = await getUserById(userId);

  if (!user) {
    redirect('/login');
  }
  
  const zones = await getZones();
  const settings = await getSettings();
  
  return (
    <>
      <Header section="User" userId={userId} />
      <div className="container mx-auto py-8">
        <UserDashboard initialZones={zones} initialUser={user} settings={settings} />
      </div>
    </>
  );
}
