'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Zone } from '@/lib/types';
import { ArrowRight, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoutePlannerProps {
  zones: Zone[] | null;
  onPlanRoute: (source: string, destination: string) => void;
  isPlanning: boolean;
}

export function RoutePlanner({
  zones,
  onPlanRoute,
  isPlanning,
}: RoutePlannerProps) {
  const [sourceZone, setSourceZone] = useState<string>('');
  const [destinationZone, setDestinationZone] = useState<string>('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceZone || !destinationZone) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select both a source and a destination zone.',
      });
      return;
    }
    if (sourceZone === destinationZone) {
      toast({
        variant: 'destructive',
        title: 'Invalid Selection',
        description: 'Source and destination cannot be the same.',
      });
      return;
    }
    onPlanRoute(sourceZone, destinationZone);
  };

  const safeZones = zones || [];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Plan Your Route</CardTitle>
        <CardDescription>
          Select your start and end points to find the least crowded path.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="source">From</Label>
            <Select onValueChange={setSourceZone} value={sourceZone} disabled={safeZones.length === 0}>
              <SelectTrigger id="source">
                <SelectValue placeholder={safeZones.length === 0 ? "Loading zones..." : "Select a source zone"} />
              </SelectTrigger>
              <SelectContent>
                {safeZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">To</Label>
            <Select onValueChange={setDestinationZone} value={destinationZone} disabled={safeZones.length === 0}>
              <SelectTrigger id="destination">
                <SelectValue placeholder={safeZones.length === 0 ? "Loading zones..." : "Select a destination zone"} />
              </SelectTrigger>
              <SelectContent>
                {safeZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isPlanning || safeZones.length === 0}>
            {isPlanning ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Find Route
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
