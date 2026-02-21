
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader } from 'lucide-react';
import { logoutUserAction } from '@/lib/actions';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase';

interface LogoutButtonProps {
    userId: string; // Base64 encoded ID from search params
}

export function LogoutButton({ userId }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const db = useFirestore();

  const handleLogout = () => {
    try {
      // Decode the userId to get the actual Firestore document ID (e.g. "kavin")
      const decodedId = Buffer.from(userId, 'base64').toString('utf-8');
      
      // Mark user as offline in Firestore
      const userRef = doc(db, 'users', decodedId);
      updateDocumentNonBlocking(userRef, { status: 'offline' });
    } catch (e) {
      console.error('Failed to mark user as offline during logout:', e);
    }

    // Trigger the logout action which performs the final redirect
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
