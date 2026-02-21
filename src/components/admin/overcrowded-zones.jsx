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
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users } from 'lucide-react';

export function OvercrowdedZones({ zones }) {
  const overcrowdedZones = zones.filter((z) => z.density === 'over-crowded');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-destructive" />
          Over-crowded Zones
        </CardTitle>
        <CardDescription>
          These zones have reached or exceeded their maximum capacity. Immediate
          attention may be required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Current Users</TableHead>
              <TableHead>Density</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overcrowdedZones.length > 0 ? (
              overcrowdedZones.map((zone) => (
                <TableRow key={zone.id} className="bg-destructive/10">
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>{zone.capacity}</TableCell>
                  <TableCell>{zone.userCount}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{zone.density}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground h-24"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8" />
                    <span>No zones are currently over-crowded.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}