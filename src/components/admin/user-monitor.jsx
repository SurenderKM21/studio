'use client';

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
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
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
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function UserMonitor({ initialUsers, initialZones }) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isPending, startTransition] = useTransition();

  const users = initialUsers.filter((u) => u.role !== 'admin' && u.name !== 'John Doe');
  const loggedInUsers = users.filter((user) => user.status === 'online');
  const loggedOutUsers = users.filter((user) => user.status !== 'online');

  const zoneMap = new Map(initialZones.map((zone) => [zone.id, zone.name]));

  const handleRemoveUser = (userId, userName) => {
    const userRef = doc(db, 'users', userId);
    deleteDocumentNonBlocking(userRef);
    toast({
      title: 'User Removed',
      description: `User "${userName}" has been removed.`,
    });
  };

  const handleClearAllUsers = () => {
    startTransition(() => {
      loggedOutUsers.forEach(user => {
        const userRef = doc(db, 'users', user.id);
        deleteDocumentNonBlocking(userRef);
      });
      toast({
        title: 'Logged Out Users Cleared',
        description: 'The logged out user list is being cleared.',
      });
    });
  };

  const UserTable = ({
    users,
    title,
    showActions,
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
                  <TableCell className="font-medium text-xs">{user.id}</TableCell>
                  <TableCell>{user.name || user.id}</TableCell>
                  <TableCell>
                    {user.lastZoneId
                      ? zoneMap.get(user.lastZoneId) ?? 'Unknown'
                      : 'N/A'}
                  </TableCell>
                  {showActions && (
                     <TableCell className="text-right">
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                          </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove the user <strong>{user.name || user.id}</strong>. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveUser(user.id, user.name || user.id)} className="bg-destructive hover:bg-destructive/90">
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
                 <Button variant="destructive">Clear Logged-out Users</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete all logged-out user data from the system. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllUsers} className="bg-destructive hover:bg-destructive/90">
                        Yes, clear data
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="space-y-8">
        <UserTable users={loggedInUsers} title="Logged In Users" showActions />
        <Separator />
        <UserTable users={loggedOutUsers} title="Logged Out Users" showActions />
      </CardContent>
    </Card>
  );
}