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
import { addZoneAction, deleteZoneAction } from '@/lib/actions';
import type { Zone } from '@/lib/types';
import { MapPin, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';
import { MapView } from '../user/map-view';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const coordinateRegex = /^-?\d+(\.\d+)?,\s?-?\d+(\.\d+)?$/;

const addZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinate1: z
    .string()
    .min(1, 'Coordinate 1 is required')
    .regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate2: z
    .string()
    .min(1, 'Coordinate 2 is required')
    .regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate3: z
    .string()
    .min(1, 'Coordinate 3 is required')
    .regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate4: z
    .string()
    .min(1, 'Coordinate 4 is required')
    .regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
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
  const [isDeleting, startDeleteTransition] = useTransition();

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

  const handleDelete = (zoneId: string) => {
    startDeleteTransition(async () => {
      const result = await deleteZoneAction(zoneId);
      if (result?.success) {
        toast({
          title: 'Zone Deleted',
          description: 'The zone has been successfully removed.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Deleting Zone',
          description: result?.error || 'An unexpected error occurred.',
        });
      }
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity')}
                placeholder="e.g., 500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coordinate1">Coordinate 1 (Top-Left)</Label>
                <Input
                  id="coordinate1"
                  {...register('coordinate1')}
                  placeholder="lat,lng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinate2">Coordinate 2 (Top-Right)</Label>
                <Input
                  id="coordinate2"
                  {...register('coordinate2')}
                  placeholder="lat,lng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinate3">
                  Coordinate 3 (Bottom-Right)
                </Label>
                <Input
                  id="coordinate3"
                  {...register('coordinate3')}
                  placeholder="lat,lng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinate4">Coordinate 4 (Bottom-Left)</Label>
                <Input
                  id="coordinate4"
                  {...register('coordinate4')}
                  placeholder="lat,lng"
                />
              </div>
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

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Existing Zones</CardTitle>
            <CardDescription>
              A list of all currently configured zones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <MapPin className="h-4 w-4 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs text-muted-foreground">
                              {zone.coordinates
                                .map(
                                  (c) => `(${c.lat.toFixed(4)}, ${c.lng.toFixed(4)})`
                                )
                                .join(', ')}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        {zone.name}
                      </TableCell>
                      <TableCell>{zone.capacity}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the <strong>{zone.name}</strong> zone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(zone.id)}
                                disabled={isDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
