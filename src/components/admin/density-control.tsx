
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Zone, DensityCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldCheck, Activity } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const densityColors: Record<DensityCategory, string> = {
  free: 'bg-green-500',
  moderate: 'bg-yellow-500',
  crowded: 'bg-orange-500',
  'over-crowded': 'bg-red-500',
};

export function DensityControl({ initialZones }: { initialZones: Zone[] }) {
  const { toast } = useToast();
  const db = useFirestore();

  const handleDensityChange = (zoneId: string, value: DensityCategory) => {
    const zoneRef = doc(db, 'zones', zoneId);
    updateDocumentNonBlocking(zoneRef, { 
      density: value, 
      manualDensity: true 
    });

    toast({
      title: 'Density Updated',
      description: `Zone density has been manually set to ${value}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <CardTitle>Crowd Density Management</CardTitle>
        </div>
        <CardDescription>
          Override the automatic density classification. Changes are broadcast to all users in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialZones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">{zone.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        'text-white capitalize',
                        densityColors[zone.density]
                      )}
                    >
                      {zone.density}
                    </Badge>
                     {zone.manualDensity && (
                      <ShieldCheck className="h-4 w-4 text-primary" title="Manual override active" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Select
                    onValueChange={(value: DensityCategory) =>
                      handleDensityChange(zone.id, value)
                    }
                    defaultValue={zone.density}
                  >
                    <SelectTrigger className="w-[180px] ml-auto">
                      <SelectValue placeholder="Set density" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="crowded">Crowded</SelectItem>
                      <SelectItem value="over-crowded">Over-crowded</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {initialZones.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                  No zones found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
