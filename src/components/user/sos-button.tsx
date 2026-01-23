
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Siren } from 'lucide-react';
import { toggleSOSAction } from '@/lib/actions';
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

interface SOSButtonProps {
  userId: string;
  initialSOSState: boolean;
}

export function SOSButton({ userId, initialSOSState }: SOSButtonProps) {
  const [isSOS, setIsSOS] = useState(initialSOSState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggleSOS = () => {
    const newSOSState = !isSOS;
    startTransition(async () => {
      const result = await toggleSOSAction(userId, newSOSState);
      if (result.success) {
        setIsSOS(newSOSState);
        toast({
          title: newSOSState ? 'SOS Signal Sent' : 'SOS Signal Cancelled',
          description: newSOSState
            ? 'Admin has been notified. Help is on the way.'
            : 'Your SOS signal has been cancelled.',
          variant: newSOSState ? 'destructive' : 'default',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
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
          disabled={isPending}
        >
          {isPending ? (
            <Loader className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <Siren className="mr-4 h-8 w-8" />
              {isSOS ? 'Cancel SOS' : 'Raise SOS'}
            </>
          )}
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
