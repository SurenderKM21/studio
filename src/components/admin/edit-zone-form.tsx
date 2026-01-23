
'use client';

import { useState, useTransition, useEffect } from 'react';
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
import type { Zone } from '@/lib/types';

const coordinateRegex = /^-?\d+(\.\d+)?,\s?-?\d+(\.\d+)?$/;

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

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UpdateZoneForm>({
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
      <DialogContent className="sm:max-w-md">
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
            
            <div className="space-y-2">
                <Label>Coordinates</Label>
                 <p className="text-sm text-muted-foreground">
                    Enter 3 or 4 coordinates in "latitude,longitude" format.
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
