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
import type { Zone } from '@/lib/types';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';
import { MapView } from '../user/map-view';

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

  const {
    register,
    reset,
    formState: { errors },
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

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success!',
        description: 'New zone has been added.',
      });
      formRef.current?.reset();
      reset();
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
                Define a new area and see a list of existing zones.
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
            
            <div className="space-y-2">
                <Label>Coordinates</Label>
                 <p className="text-sm text-muted-foreground">
                    Enter 3 or 4 coordinates in "latitude,longitude" format. You can get these from a tool like Google Maps.
                </p>
                <Input {...register('coordinate1')} placeholder="e.g., 40.7128,-74.0060" />
                {errors.coordinate1 && <p className="text-xs text-destructive">{errors.coordinate1.message}</p>}
                <Input {...register('coordinate2')} placeholder="e.g., 40.7138,-74.0070" />
                {errors.coordinate2 && <p className="text-xs text-destructive">{errors.coordinate2.message}</p>}
                <Input {...register('coordinate3')} placeholder="e.g., 40.7148,-74.0060" />
                {errors.coordinate3 && <p className="text-xs text-destructive">{errors.coordinate3.message}</p>}
                <Input {...register('coordinate4')} placeholder="Optional 4th coordinate" />
                {errors.coordinate4 && <p className="text-xs text-destructive">{errors.coordinate4.message}</p>}
            </div>

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
