
'use client';

import { useEffect, useMemo, Suspense } from 'react';
import { UserDashboard } from '@/components/user/user-dashboard';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { Loader } from 'lucide-react';

function UserAuthGuard({ userId, decodedUserId }) {
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

function UserPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const decodedUserId = useMemo(() => {
    if (!userId) return null;
    try {
      return Buffer.from(userId, 'base64').toString('utf-8');
    } catch (e) {
      return null;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !decodedUserId) {
      router.push('/login');
    }
  }, [userId, decodedUserId, router]);

  if (!userId || !decodedUserId) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Redirecting to login...</span>
      </div>
    );
  }

  return (
    <FirebaseClientProvider>
      <UserAuthGuard userId={userId} decodedUserId={decodedUserId} />
    </FirebaseClientProvider>
  );
}

export default function UserPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Initializing Navigator...</span>
      </div>
    }>
      <UserPageContent />
    </Suspense>
  );
}
