import { UserDashboard } from '@/components/user/user-dashboard';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider } from '@/firebase';

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

  let decodedUserId;
  try {
    decodedUserId = Buffer.from(userId, 'base64').toString('utf-8');
  } catch (e) {
    console.error("Failed to decode userId:", e);
    redirect('/login');
  }

  return (
    <FirebaseClientProvider>
      <Header section="User" userId={userId} />
      <div className="container mx-auto py-8">
        <UserDashboard userId={decodedUserId} />
      </div>
    </FirebaseClientProvider>
  );
}