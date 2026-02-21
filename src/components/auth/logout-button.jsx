'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader } from 'lucide-react';
import { logoutUserAction } from '@/lib/actions';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function LogoutButton({ userId }) {
  const [isPending, startTransition] = useTransition();
  const db = useFirestore();

  const handleLogout = () => {
    try {
      const decodedId = Buffer.from(userId, 'base64').toString('utf-8');
      const userRef = doc(db, 'users', decodedId);
      updateDocumentNonBlocking(userRef, { status: 'offline' });
    } catch (e) {
      console.error('Failed to mark user as offline during logout:', e);
    }

    startTransition(() => {
        logoutUserAction(userId);
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? (
        <Loader className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      Logout
    </Button>
  );
}