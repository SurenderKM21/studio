'use client';

import { useEffect, useMemo, Suspense } from 'react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider, initializeFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, Lock } from 'lucide-react';

function AdminAuthGuard({ userId, decodedUserId }: { userId: string, decodedUserId: string }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { firestore } = initializeFirebase();
  
  const userRef = useMemoFirebase(() => doc(firestore, 'users', decodedUserId), [firestore, decodedUserId]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // Derived values for the effect
  const userEmail = user?.email;
  const userRole = profile?.role;

  useEffect(() => {
    // Only act when initial loading is finished
    if (isUserLoading || isProfileLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // For the prototype, we trust the admin email or the explicit role
    const isAdminByEmail = userEmail === 'admin@evacai.com';
    const isAdminByRole = userRole === 'admin';

    if (!isAdminByEmail && !isAdminByRole) {
      router.push('/user?userId=' + userId);
    }
  }, [user, isUserLoading, isProfileLoading, userEmail, userRole, router, userId]);

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Verifying Admin Permissions...</span>
      </div>
    );
  }

  const isAdminByEmail = user?.email === 'admin@evacai.com';
  const isAdminByRole = profile?.role === 'admin';

  if (!isAdminByEmail && !isAdminByRole) {
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
      <Header section="Admin" userId={userId} />
      <div className="container mx-auto py-8 px-4">
        <AdminDashboard userId={decodedUserId} />
      </div>
    </>
  );
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  // Handle missing userId unconditionally with a hook
  useEffect(() => {
    if (!userId) {
      router.push('/login');
    }
  }, [userId, router]);

  // Decode the userId safely
  const decodedUserId = useMemo(() => {
    if (!userId) return null;
    try {
      return Buffer.from(userId, 'base64').toString('utf-8');
    } catch (e) {
      console.error("Failed to decode userId:", e);
      return null;
    }
  }, [userId]);

  // Redirect if decoding fails
  useEffect(() => {
    if (userId && !decodedUserId) {
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
      <AdminAuthGuard userId={userId} decodedUserId={decodedUserId} />
    </FirebaseClientProvider>
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
      <AdminPageContent />
    </Suspense>
  );
}
