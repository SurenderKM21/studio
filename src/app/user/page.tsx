'use client';

import { useEffect } from 'react';
import { UserDashboard } from '@/components/user/user-dashboard';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { Loader } from 'lucide-react';

function UserAuthGuard({ userId, decodedUserId }: { userId: string, decodedUserId: string }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Synchronizing Session...</span>
      </div>
    );
  }

  return (
    <>
      <Header section="User" userId={userId} />
      <div className="container mx-auto py-8 px-4">
        <UserDashboard userId={decodedUserId} />
      </div>
    </>
  );
}

export default function UserPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  if (!userId) {
    useEffect(() => {
      router.push('/login');
    }, [router]);
    return null;
  }

  let decodedUserId;
  try {
    decodedUserId = Buffer.from(userId, 'base64').toString('utf-8');
  } catch (e) {
    console.error("Failed to decode userId:", e);
    useEffect(() => {
      router.push('/login');
    }, [router]);
    return null;
  }

  return (
    <FirebaseClientProvider>
      <UserAuthGuard userId={userId} decodedUserId={decodedUserId} />
    </FirebaseClientProvider>
  );
}
