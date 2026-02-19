
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
import { Button } from '@/components/ui/button';
import type { Zone, DensityCategory } from '@/lib/types';
import { Trash2, Users } from 'lucide-react';
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
import { EditZoneForm } from './edit-zone-form';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const densityColors: Record<DensityCategory, string> = {
  free: 'bg-green-500',
  moderate: 'bg-yellow-500',
  crowded: 'bg-orange-500',
  'over-crowded': 'bg-red-500',
};

export function ZoneDetails({ initialZones }: { initialZones: Zone[] }) {
  const { toast } = useToast();
  const db = useFirestore();

  const handleDelete = (zoneId: string, zoneName: string) => {
    const zoneRef = doc(db, 'zones', zoneId);
    deleteDocumentNonBlocking(zoneRef);
    toast({
      title: 'Zone Deleted',
      description: `The "${zoneName}" zone is being removed from the cloud.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Zones</CardTitle>
        <CardDescription>
          Detailed overview of all configured areas. Click the edit icon to modify a zone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Density</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialZones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-bold">{zone.name}</TableCell>
                <TableCell>{zone.capacity}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    {zone.userCount}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-white capitalize', densityColors[zone.density])}>
                    {zone.density}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <EditZoneForm zone={zone} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Delete Zone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the <strong>{zone.name}</strong> zone from the cloud.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(zone.id, zone.name)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {initialZones.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                  No zones found. Add one in the "Add New Zone" section.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
