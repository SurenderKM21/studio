
import { UserDashboard } from '@/components/user/user-dashboard';
import { db } from '@/lib/data';
import { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';

export const dynamic = 'force-dynamic';


export default function UserPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const userId = searchParams?.userId;

  if (typeof userId !== 'string') {
    redirect('/login');
  }

  const user = db.getUserById(userId);

  if (!user) {
    redirect('/login');
  }
  
  const zones = db.getZones();
  const settings = db.getSettings();
  
  return (
    <>
      <Header section="User" userId={userId} />
      <div className="container mx-auto py-8">
        <UserDashboard initialZones={zones} initialUser={user} settings={settings} />
      </div>
    </>
  );
}
