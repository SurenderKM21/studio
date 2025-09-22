'use client';

import type { User } from '@/lib/types';
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

export function UserMonitor({ initialUsers }: { initialUsers: User[] }) {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Users</CardTitle>
        <CardDescription>
          A list of currently tracked users and their last known location.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Latitude</TableHead>
              <TableHead>Longitude</TableHead>
              <TableHead className="text-right">Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length > 0 ? (
              initialUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                   <TableCell>
                    {user.lastLatitude !== undefined ? user.lastLatitude.toFixed(6) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {user.lastLongitude !== undefined ? user.lastLongitude.toFixed(6) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.lastSeen
                      ? new Date(user.lastSeen).toLocaleString()
                      : 'Never'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                  No active users yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
