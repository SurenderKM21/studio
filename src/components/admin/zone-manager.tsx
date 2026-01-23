
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
import { addZoneAction } from '@/lib/actions';
import type { Zone, Coordinate } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';
import { MapView } from '../user/map-view';
import { GoogleMapsZoneSelector } from './google-maps-zone-selector';
import { z } from 'zod';

const initialState = {
  error: undefined,
  success: false,
};

export function ZoneManager({ initialZones }: { initialZones: Zone[] }) {
  const [state, formAction] = useActionState(addZoneAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);

  const customFormAction = (formData: FormData) => {
    formData.append('coordinates', JSON.stringify(coordinates));
    formAction(formData);
  };

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success!',
        description: 'New zone has been added.',
      });
      formRef.current?.reset();
      setCoordinates([]);
    } else if (state?.error) {
       let errorMsg = 'An unexpected error occurred.';
       if (typeof state.error === 'string') {
        errorMsg = state.error;
      } else if (typeof state.error === 'object' && state.error !== null) {
        errorMsg = Object.values(state.error).flat().join(' ');
      }
      toast({
        variant: 'destructive',
        title: 'Error Adding Zone',
        description: errorMsg,
      });
    }
  }, [state, toast]);

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
        <form action={customFormAction} ref={formRef}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Main Stage"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                placeholder="e.g., 500"
                min="1"
                defaultValue="10"
                required
              />
            </div>
            
            <GoogleMapsZoneSelector coordinates={coordinates} onCoordinatesChange={setCoordinates} />
            
            {state?.error && typeof state.error === 'object' && state.error.coordinates && (
                 <p className="text-xs text-destructive">{state.error.coordinates.join(' ')}</p>
            )}

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
