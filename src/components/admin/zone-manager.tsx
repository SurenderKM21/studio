'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addZoneAction } from '@/lib/actions';
import type { Zone } from '@/lib/types';
import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const addZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinates: z.string().min(1, 'Coordinates are required'),
});

type AddZoneForm = z.infer<typeof addZoneSchema>;

const initialState = {
  error: undefined,
  success: false,
};

export function ZoneManager({ initialZones }: { initialZones: Zone[] }) {
  const [state, formAction] = useFormState(addZoneAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<AddZoneForm>({
    resolver: zodResolver(addZoneSchema),
  });
  
  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: 'New zone has been added.',
      });
      formRef.current?.reset();
      reset();
    }
  }, [state, toast, reset]);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Add New Zone</CardTitle>
          <CardDescription>
            Define a new area within the event grounds.
          </CardDescription>
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
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity')}
                placeholder="e.g., 500"
              />
              {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="coordinates">GPS Coordinates</Label>
              <Input
                id="coordinates"
                {...register('coordinates')}
                placeholder="e.g., 34.05, -118.24; 34.06, -118.25"
              />
               {errors.coordinates && <p className="text-sm text-destructive">{errors.coordinates.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Add Zone</Button>
          </CardFooter>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Existing Zones</CardTitle>
          <CardDescription>
            A list of all currently configured zones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Capacity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {zone.name}
                  </TableCell>
                  <TableCell>{zone.capacity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
