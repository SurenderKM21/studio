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
import { Pencil, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleMapsZoneSelector } from './google-maps-zone-selector';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function EditZoneForm({ zone }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const [name, setName] = useState(zone.name);
  const [capacity, setCapacity] = useState(zone.capacity);
  const [coordinates, setCoordinates] = useState(zone.coordinates || []);

  // Sync state when dialog opens or zone changes
  useEffect(() => {
    if (isOpen) {
      setName(zone.name);
      setCapacity(zone.capacity);
      setCoordinates(zone.coordinates || []);
    }
  }, [isOpen, zone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (coordinates.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Invalid Boundary',
        description: 'Zones must have at least 3 points to form a shape.',
      });
      return;
    }

    const zoneRef = doc(db, 'zones', zone.id);
    updateDocumentNonBlocking(zoneRef, {
      name,
      capacity: Number(capacity),
      coordinates,
    });
    
    toast({
      title: 'Zone Updated',
      description: `Saving changes for "${name}"...`,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit Zone">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Zone: {zone.name}</DialogTitle>
            <DialogDescription>
              Update the zone properties or redraw its boundaries on the satellite map.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Zone Name</Label>
                <Input 
                  id="edit-name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Main Entrance"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Max Capacity</Label>
                <Input 
                  id="edit-capacity" 
                  type="number" 
                  value={capacity} 
                  onChange={(e) => setCapacity(e.target.value)} 
                  min="1" 
                  required 
                />
              </div>
            </div>
            
            <div className="border rounded-lg p-2 bg-muted/30">
              <GoogleMapsZoneSelector 
                coordinates={coordinates} 
                onCoordinatesChange={setCoordinates} 
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit">Update Zone</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
