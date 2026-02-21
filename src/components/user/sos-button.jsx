'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Siren } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function SOSButton({ userId, initialSOSState }) {
  const [isSOS, setIsSOS] = useState(initialSOSState);
  const { toast } = useToast();
  const db = useFirestore();

  const handleToggleSOS = () => {
    const newSOSState = !isSOS;
    const userRef = doc(db, 'users', userId);
    
    updateDocumentNonBlocking(userRef, { sos: newSOSState });
    
    setIsSOS(newSOSState);
    toast({
      title: newSOSState ? 'SOS Signal Sent' : 'SOS Signal Cancelled',
      description: newSOSState
        ? 'Admin has been notified. Help is on the way.'
        : 'Your SOS signal has been cancelled.',
      variant: newSOSState ? 'destructive' : 'default',
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={isSOS ? 'destructive' : 'outline'}
          className={cn(
            'w-full h-24 text-2xl font-bold',
            isSOS && 'animate-pulse'
          )}
        >
          <Siren className="mr-4 h-8 w-8" />
          {isSOS ? 'Cancel SOS' : 'Raise SOS'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSOS
              ? 'Are you sure you want to cancel your SOS?'
              : 'Are you sure you want to raise an SOS?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSOS
              ? 'This will notify the admin that you are safe.'
              : 'This should only be used in a real emergency. Admin will be notified immediately of your location.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggleSOS}
            className={!isSOS ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isSOS ? 'Yes, I am Safe' : 'Yes, Raise SOS'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
