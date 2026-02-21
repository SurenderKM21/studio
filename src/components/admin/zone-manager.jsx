'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MapView } from '../user/map-view';
import { GoogleMapsZoneSelector } from './google-maps-zone-selector';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function ZoneManager({ initialZones }) {
  const { toast } = useToast();
  const db = useFirestore();
  const [coordinates, setCoordinates] = useState([]);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(10);

  const handleAddZone = (e) => {
    e.preventDefault();
    if (coordinates.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Coordinates',
        description: 'Please define at least 3 points for the zone.',
      });
      return;
    }

    const zonesRef = collection(db, 'zones');
    addDocumentNonBlocking(zonesRef, {
      name,
      capacity,
      coordinates,
      userCount: 0,
      density: 'free',
      manualDensity: false
    });

    toast({
      title: 'Success!',
      description: 'New zone is being added.',
    });
    setName('');
    setCapacity(10);
    setCoordinates([]);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
            <div>
              <CardTitle>Add New Zone</CardTitle>
              <CardDescription>
                Define a new area by clicking on the map.
              </CardDescription>
            </div>
        </CardHeader>
        <form onSubmit={handleAddZone}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Stage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="e.g., 500"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
              />
            </div>
            
            <GoogleMapsZoneSelector coordinates={coordinates} onCoordinatesChange={setCoordinates} />

          </CardContent>
          <CardFooter>
            <Button type="submit">Add Zone</Button>
          </CardFooter>
        </form>
      </Card>
      <div className="min-h-[550px]">
        <MapView zones={initialZones} route={[]} alternativeRoute={[]} />
      </div>
    </div>
  );
}