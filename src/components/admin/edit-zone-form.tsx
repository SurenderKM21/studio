
'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { GoogleMapsZoneSelector } from './google-maps-zone-selector';

interface EditZoneFormProps {
  zone: Zone;
}

export function EditZoneForm({ zone }: EditZoneFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Local state for form fields
  const [name, setName] = useState(zone.name);
  const [capacity, setCapacity] = useState(zone.capacity);
  const [coordinates, setCoordinates] = useState<Coordinate[]>(zone.coordinates);

  useEffect(() => {
    if (isOpen) {
      setName(zone.name);
      setCapacity(zone.capacity);
      setCoordinates(zone.coordinates);
    }
  }, [isOpen, zone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateZoneAction(zone.id, {
        name,
        capacity,
        coordinates,
      });
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Zone: {zone.name}</DialogTitle>
            <DialogDescription>
              Make changes to your zone here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} min="1" />
            </div>
            
            <GoogleMapsZoneSelector coordinates={coordinates} onCoordinatesChange={setCoordinates} />
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
