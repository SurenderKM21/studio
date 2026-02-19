
'use client';

import { useState, useEffect } from 'react';
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
import { Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Zone, Coordinate } from '@/lib/types';
import { GoogleMapsZoneSelector } from './google-maps-zone-selector';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface EditZoneFormProps {
  zone: Zone;
}

export function EditZoneForm({ zone }: EditZoneFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

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
    const zoneRef = doc(db, 'zones', zone.id);
    updateDocumentNonBlocking(zoneRef, {
      name,
      capacity,
      coordinates,
    });
    
    toast({
      title: 'Zone Updated',
      description: 'The zone details have been updated.',
    });
    setIsOpen(false);
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
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
