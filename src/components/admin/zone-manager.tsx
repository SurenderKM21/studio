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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addZoneAction } from '@/lib/actions';
import type { Zone, Coordinate } from '@/lib/types';
import { useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';
import { MapView } from '../user/map-view';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const coordinateRegex = /^-?\d+(\.\d+)?,\s?-?\d+(\.\d+)?$/;

const addZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinate1: z.string().min(1, 'At least 3 coordinates are required.').regex(coordinateRegex, 'Invalid format'),
  coordinate2: z.string().min(1, 'At least 3 coordinates are required.').regex(coordinateRegex, 'Invalid format'),
  coordinate3: z.string().min(1, 'At least 3 coordinates are required.').regex(coordinateRegex, 'Invalid format'),
  coordinate4: z.string().regex(coordinateRegex, 'Invalid format').optional().or(z.literal('')),
});

type AddZoneForm = z.infer<typeof addZoneSchema>;

const initialState = {
  error: undefined,
  success: false,
};

export function ZoneManager({ initialZones }: { initialZones: Zone[] }) {
  const [state, formAction] = useActionState(addZoneAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const InteractiveZoneMap = useMemo(() => dynamic(() => import('./interactive-zone-map').then(mod => mod.InteractiveZoneMap), {
      ssr: false,
      loading: () => <Skeleton className="h-[400px] w-full" />
  }), []);


  const {
    register,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<AddZoneForm>({
    resolver: zodResolver(addZoneSchema),
    defaultValues: {
        name: '',
        capacity: 10,
        coordinate1: '',
        coordinate2: '',
        coordinate3: '',
        coordinate4: ''
    }
  });

  const coordinatesFromForm = watch(['coordinate1', 'coordinate2', 'coordinate3', 'coordinate4']);

  const handleCoordinatesChange = (newCoords: Coordinate[]) => {
      const coordStrings = newCoords.map(c => `${c.lat},${c.lng}`);
      setValue('coordinate1', coordStrings[0] || '', { shouldValidate: true });
      setValue('coordinate2', coordStrings[1] || '', { shouldValidate: true });
      setValue('coordinate3', coordStrings[2] || '', { shouldValidate: true });
      setValue('coordinate4', coordStrings[3] || '', { shouldValidate: true });
  };
  
  const mapCoordinates = useMemo(() => {
    return coordinatesFromForm.filter(c => c && coordinateRegex.test(c)).map(c => {
        const [lat, lng] = c.split(',').map(Number);
        return { lat, lng };
    });
  }, [coordinatesFromForm]);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success!',
        description: 'New zone has been added.',
      });
      formRef.current?.reset();
      reset();
      handleCoordinatesChange([]); // Also clear map
    } else if (state?.error) {
      let errorMsg = 'An unexpected error occurred.';
      if (typeof state.error === 'string') {
        errorMsg = state.error;
      } else if (typeof state.error === 'object' && state.error !== null) {
        const fieldErrors = Object.values(state.error).flat();
        if (fieldErrors.length > 0) {
          errorMsg = fieldErrors.join(' ');
        }
      }
      toast({
        variant: 'destructive',
        title: 'Error Adding Zone',
        description: errorMsg,
      });
    }
  }, [state, toast, reset]);

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
            <div>
              <CardTitle>Add New Zone</CardTitle>
              <CardDescription>
                Define a new area by clicking on the map, or see a list of existing zones.
              </CardDescription>
            </div>
        </CardHeader>
        <form action={formAction} ref={formRef}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Main Stage"
              />
               {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity')}
                placeholder="e.g., 500"
                min="1"
              />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>

            <InteractiveZoneMap 
                coordinates={mapCoordinates} 
                onCoordinatesChange={handleCoordinatesChange} 
            />

            {/* Hidden inputs for validation */}
            <input type="hidden" {...register('coordinate1')} />
            <input type="hidden" {...register('coordinate2')} />
            <input type="hidden" {...register('coordinate3')} />
            <input type="hidden" {...register('coordinate4')} />
            {errors.coordinate1 && <p className="text-xs text-destructive">{errors.coordinate1.message}</p>}
           
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
