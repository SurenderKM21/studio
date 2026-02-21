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
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Siren, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface SOSMonitorProps {
  initialUsers: User[];
  initialZones: Zone[];
}

export function SOSMonitor({ initialUsers, initialZones }: SOSMonitorProps) {
  const { toast } = useToast();
  const db = useFirestore();

  const sosUsers = initialUsers.filter((u) => u.sos);
  const zoneMap = new Map(initialZones.map((zone) => [zone.id, zone.name]));

  const handleResolveSOS = (userId: string, userName: string) => {
    const userRef = doc(db, 'users', userId);
    updateDocumentNonBlocking(userRef, { sos: false });
    toast({
      title: 'SOS Resolved',
      description: `User "${userName || userId}" has been marked as safe.`,
    });
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Siren />
          Active SOS Alerts
        </CardTitle>
        <CardDescription>
          These users have triggered an SOS signal and may require immediate
          assistance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Last Known Zone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sosUsers.length > 0 ? (
                sosUsers.map((user) => (
                  <TableRow key={user.id} className="bg-destructive/10">
                    <TableCell className="font-medium">{user.name || user.id}</TableCell>
                    <TableCell>
                      {user.lastZoneId
                        ? zoneMap.get(user.lastZoneId) ?? 'Unknown'
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleResolveSOS(user.id, user.name || user.id)}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Mark as Safe
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground h-24"
                  >
                    <div className="flex flex-col items-center gap-2">
                        <UserIcon className="h-8 w-8" />
                        <span>No active SOS signals.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}