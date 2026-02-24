'use client';

import { useEffect, Suspense } from 'react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider, initializeFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, Lock } from 'lucide-react';

function AdminAuthGuard() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { firestore } = initializeFirebase();
  
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const isAuthenticated = !!user;
  const isAdminByRole = profile?.role === 'admin';
  const isAuthorized = isAuthenticated && isAdminByRole;
  const isDataReady = !isUserLoading && !isProfileLoading;

  useEffect(() => {
    if (!isDataReady) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAuthorized) {
      router.push('/user');
    }
  }, [isDataReady, isAuthenticated, isAuthorized, router]);

  if (!isDataReady) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Verifying Admin Permissions...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 text-center p-8">
        <Lock className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You do not have the required permissions to view the Admin Central. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <>
      <Header section="Admin" />
      <div className="container mx-auto py-8 px-4">
        <AdminDashboard userId={user.uid} />
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Initializing Admin Dashboard...</span>
      </div>
    }>
      <FirebaseClientProvider>
        <AdminAuthGuard />
      </FirebaseClientProvider>
    </Suspense>
  );
}