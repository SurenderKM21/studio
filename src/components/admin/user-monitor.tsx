
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

interface UserMonitorProps {
  initialUsers: User[];
  initialZones: Zone[];
}

export function UserMonitor({ initialUsers, initialZones }: UserMonitorProps) {
  const users = initialUsers.filter(u => u.role !== 'admin');
  const loggedInUsers = users.filter(user => user.status === 'online');
  const loggedOutUsers = users.filter(user => user.status !== 'online');
  
  const zoneMap = new Map(initialZones.map(zone => [zone.id, zone.name]));

  const UserTable = ({ users, title }: { users: User[], title: string }) => (
    <div>
      <h3 className="text-xl font-semibold mb-2">{title} ({users.length})</h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Zone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="text-right">
                    {user.lastZoneId ? zoneMap.get(user.lastZoneId) ?? 'Unknown' : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
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
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
        <CardDescription>
          A list of logged-in and logged-out users and their last known location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <UserTable users={loggedInUsers} title="Logged In Users" />
        <Separator />
        <UserTable users={loggedOutUsers} title="Logged Out Users" />
      </CardContent>
    </Card>
  );
}
