
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserStatusMonitorProps {
  initialUsers: User[];
  initialZones: Zone[];
}

export function UserStatusMonitor({ initialUsers, initialZones }: UserStatusMonitorProps) {
  const regularUsers = initialUsers.filter(user => user.role !== 'admin');
  const zoneMap = new Map(initialZones.map(zone => [zone.id, zone.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Status</CardTitle>
        <CardDescription>
          A list of users, their last known zone, and their login status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Last Known Zone</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regularUsers.length > 0 ? (
              regularUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    {user.lastZoneId ? zoneMap.get(user.lastZoneId) ?? 'Unknown' : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={cn(
                        user.status === 'online' ? 'bg-green-500' : 'bg-gray-500',
                        'text-white'
                      )}
                    >
                      {user.status === 'online' ? 'Logged In' : 'Logged Out'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                  No user activity recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
