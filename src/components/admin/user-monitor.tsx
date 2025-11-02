
'use client';

import type { User, Zone } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { removeUserAction, clearAllUsersAction } from '@/lib/actions';
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

interface UserMonitorProps {
  initialUsers: User[];
  initialZones: Zone[];
}

export function UserMonitor({ initialUsers, initialZones }: UserMonitorProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const users = initialUsers.filter((u) => u.role !== 'admin');
  const loggedInUsers = users.filter((user) => user.status === 'online');
  const loggedOutUsers = users.filter((user) => user.status !== 'online');

  const zoneMap = new Map(initialZones.map((zone) => [zone.id, zone.name]));

  const handleRemoveUser = (userId: string, userName: string) => {
    startTransition(async () => {
      const result = await removeUserAction(userId);
      if (result.success) {
        toast({
          title: 'User Removed',
          description: `User "${userName}" has been removed.`,
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

  const handleClearAllUsers = () => {
     startTransition(async () => {
      const result = await clearAllUsersAction();
      if (result.success) {
        toast({
          title: 'All Users Cleared',
          description: 'The user list has been cleared.',
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


  const UserTable = ({
    users,
    title,
    showActions,
  }: {
    users: User[];
    title: string;
    showActions?: boolean;
  }) => (
    <div>
      <h3 className="text-xl font-semibold mb-2">
        {title} ({users.length})
      </h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Zone</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    {user.lastZoneId
                      ? zoneMap.get(user.lastZoneId) ?? 'Unknown'
                      : 'N/A'}
                  </TableCell>
                  {showActions && (
                     <TableCell className="text-right">
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isPending}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove the user <strong>{user.name}</strong>. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveUser(user.id, user.name)} className="bg-destructive hover:bg-destructive/90">
                                    Remove User
                                </AlertDialogAction>
                            </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 4 : 3}
                  className="text-center text-muted-foreground h-24"
                >
                  No users in this category.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className='flex flex-row items-start justify-between'>
        <div>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>
              A list of logged-in and logged-out users and their last known location.
            </CardDescription>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button variant="destructive" disabled={isPending}>Clear All User Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete all user data from the system. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllUsers} className="bg-destructive hover:bg-destructive/90">
                        Yes, clear all data
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="space-y-8">
        <UserTable users={loggedInUsers} title="Logged In Users" />
        <Separator />
        <UserTable users={loggedOutUsers} title="Logged Out Users" showActions />
      </CardContent>
    </Card>
  );
}
