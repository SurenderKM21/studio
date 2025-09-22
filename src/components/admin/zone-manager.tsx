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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addZoneAction } from '@/lib/actions';
import type { Zone } from '@/lib/types';
import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';

const coordinateRegex = /^-?\d+(\.\d+)?,\s?-?\d+(\.\d+)?$/;

const addZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinate1: z.string().min(1, 'Coordinate 1 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate2: z.string().min(1, 'Coordinate 2 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate3: z.string().min(1, 'Coordinate 3 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate4: z.string().min(1, 'Coordinate 4 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
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
       } else if (typeof state.error === 'object') {
          const fieldErrors = Object.values(state.error).flat();
          if (fieldErrors.length > 0) {
            errorMsg = fieldErrors.join(' ');
          }
       }
       toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMsg,
      });
    }
  }, [state, toast, reset]);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Add New Zone</CardTitle>
          <CardDescription>
            Define a new area with four corner GPS coordinates.
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
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="coordinate1">Coordinate 1 (Top-Left)</Label>
                <Input
                  id="coordinate1"
                  {...register('coordinate1')}
                  placeholder="lat,lng"
                />
                {errors.coordinate1 && <p className="text-sm text-destructive">{errors.coordinate1.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinate2">Coordinate 2 (Top-Right)</Label>
                <Input
                  id="coordinate2"
                  {...register('coordinate2')}
                  placeholder="lat,lng"
                />
                 {errors.coordinate2 && <p className="text-sm text-destructive">{errors.coordinate2.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinate3">Coordinate 3 (Bottom-Right)</Label>
                <Input
                  id="coordinate3"
                  {...register('coordinate3')}
                  placeholder="lat,lng"
                />
                 {errors.coordinate3 && <p className="text-sm text-destructive">{errors.coordinate3.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinate4">Coordinate 4 (Bottom-Left)</Label>
                <Input
                  id="coordinate4"
                  {...register('coordinate4')}
                  placeholder="lat,lng"
                />
                 {errors.coordinate4 && <p className="text-sm text-destructive">{errors.coordinate4.message}</p>}
              </div>
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
