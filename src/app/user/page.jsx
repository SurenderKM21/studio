'use client';

import { useEffect, Suspense } from 'react';
import { UserDashboard } from '@/components/user/user-dashboard';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { Loader } from 'lucide-react';

function UserAuthGuard() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Synchronizing Session...</span>
      </div>
    );
  }

  return (
    <>
      <Header section="User" />
      <div className="container mx-auto py-8 px-4">
        <UserDashboard userId={user.uid} />
      </div>
    </>
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
      <FirebaseClientProvider>
        <UserAuthGuard />
      </FirebaseClientProvider>
    </Suspense>
  );
}