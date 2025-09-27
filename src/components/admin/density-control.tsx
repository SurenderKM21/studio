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
import { manualUpdateDensityAction } from '@/lib/actions';
import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

const densityColors: Record<DensityCategory, string> = {
  free: 'bg-green-500',
  moderate: 'bg-yellow-500',
  crowded: 'bg-orange-500',
  'over-crowded': 'bg-red-500',
};

export function DensityControl({ initialZones }: { initialZones: Zone[] }) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDensityChange = (zoneId: string, value: DensityCategory) => {
    startTransition(async () => {
      await manualUpdateDensityAction(zoneId, value);
      
      const updatedZones = zones.map(z => 
        z.id === zoneId ? { ...z, density: value, manualDensity: true } : z
      );
      setZones(updatedZones);

      toast({
        title: 'Density Updated',
        description: `Zone density has been manually set to ${value}.`,
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Density Override</CardTitle>
        <CardDescription>
          Manually set the crowd density for each zone. This will override
          automatic classification until the user count in the zone changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead>Current Density</TableHead>
              <TableHead className="text-right">Set Density</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">{zone.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        'text-white',
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
                    disabled={isPending}
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
