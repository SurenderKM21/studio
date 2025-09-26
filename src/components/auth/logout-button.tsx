
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader } from 'lucide-react';
import { logoutUserAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface LogoutButtonProps {
    userId: string;
}

export function LogoutButton({ userId }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleLogout = () => {
    startTransition(() => {
        logoutUserAction(userId).then(() => {
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out."
            });
        });
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

    