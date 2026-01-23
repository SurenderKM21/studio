
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateZoneAction } from '@/lib/actions';
import type { Zone, Coordinate } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const coordinateRegex = /^-?\d+(\.\d+)?,\s?-?\d+(\.\d+)?$/;

// Updated schema to handle 3 or 4 points
const updateZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinate1: z.string().min(1, 'At least 3 coordinates are required.').regex(coordinateRegex, 'Invalid format'),
  coordinate2: z.string().min(1, 'At least 3 coordinates are required.').regex(coordinateRegex, 'Invalid format'),
  coordinate3: z.string().min(1, 'At least 3 coordinates are required.').regex(coordinateRegex, 'Invalid format'),
  coordinate4: z.string().regex(coordinateRegex, 'Invalid format').optional().or(z.literal('')),
});


type UpdateZoneForm = z.infer<typeof updateZoneSchema>;

interface EditZoneFormProps {
  zone: Zone;
}

export function EditZoneForm({ zone }: EditZoneFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const InteractiveZoneMap = useMemo(() => dynamic(() => import('./interactive-zone-map').then(mod => mod.InteractiveZoneMap), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />,
  }), []);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<UpdateZoneForm>({
    resolver: zodResolver(updateZoneSchema),
    defaultValues: {
      name: zone.name,
      capacity: zone.capacity,
      coordinate1: zone.coordinates[0] ? `${zone.coordinates[0].lat},${zone.coordinates[0].lng}` : '',
      coordinate2: zone.coordinates[1] ? `${zone.coordinates[1].lat},${zone.coordinates[1].lng}` : '',
      coordinate3: zone.coordinates[2] ? `${zone.coordinates[2].lat},${zone.coordinates[2].lng}` : '',
      coordinate4: zone.coordinates[3] ? `${zone.coordinates[3].lat},${zone.coordinates[3].lng}` : '',
    },
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
    if (isOpen) {
      reset({
        name: zone.name,
        capacity: zone.capacity,
        coordinate1: zone.coordinates[0] ? `${zone.coordinates[0].lat},${zone.coordinates[0].lng}` : '',
        coordinate2: zone.coordinates[1] ? `${zone.coordinates[1].lat},${zone.coordinates[1].lng}` : '',
        coordinate3: zone.coordinates[2] ? `${zone.coordinates[2].lat},${zone.coordinates[2].lng}` : '',
        coordinate4: zone.coordinates[3] ? `${zone.coordinates[3].lat},${zone.coordinates[3].lng}` : '',
      });
    }
  }, [isOpen, reset, zone]);

  const onSubmit = (data: UpdateZoneForm) => {
    startTransition(async () => {
      const result = await updateZoneAction(zone.id, data);
      if (result.success) {
        toast({
          title: 'Zone Updated',
          description: 'The zone details have been successfully updated.',
        });
        setIsOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error || 'An unexpected error occurred.',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Zone: {zone.name}</DialogTitle>
            <DialogDescription>
              Make changes to your zone here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input id="capacity" type="number" {...register('capacity')} min="1" />
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

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
