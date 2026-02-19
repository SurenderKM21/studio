'use client';

import { useEffect, useState } from 'react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider, initializeFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Loader } from 'lucide-react';

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    // Ensure we have at least an anonymous session for Firestore rules
    const initAuth = async () => {
      try {
        const { auth } = initializeFirebase();
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsAuthChecking(false);
      }
    };

    initAuth();
  }, [userId, router]);

  if (!userId) return null;

  let decodedUserId;
  try {
    decodedUserId = Buffer.from(userId, 'base64').toString('utf-8');
  } catch (e) {
    console.error("Failed to decode userId:", e);
    router.push('/login');
    return null;
  }

  if (isAuthChecking) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Initializing Admin Session...</span>
      </div>
    );
  }

  return (
    <FirebaseClientProvider>
      <Header section="Admin" userId={userId} />
      <div className="container mx-auto py-8 px-4">
        <AdminDashboard userId={decodedUserId} />
      </div>
    </FirebaseClientProvider>
  );
}