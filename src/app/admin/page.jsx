'use client';

import React, { useEffect, useState } from 'react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { Header } from '@/components/layout/header';
import { useSearchParams, useRouter } from 'next/navigation';
import { getUserById } from '@/lib/actions';

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    const verifyAdmin = async () => {
      try {
        const decodedId = Buffer.from(userId, 'base64').toString('utf-8');
        const user = await getUserById(decodedId);
        
        if (!user || user.role !== 'admin') {
          router.push('/login');
        } else {
          setAdminUser(user);
        }
      } catch (e) {
        console.error("Verification error:", e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [userId, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Verifying Admin Access...</div>;
  }

  return (
    <>
      <Header section="Admin" userId={userId} />
      <div className="container mx-auto py-8 px-4">
        <AdminDashboard />
      </div>
    </>
  );
}
