
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zone, ZoneNote } from '@/lib/types';
import { useState, useTransition } from 'react';
import { addZoneNoteAction, deleteZoneNoteAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff, Loader } from 'lucide-react';
import { Badge } from '../ui/badge';
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

interface ZoneNotesManagerProps {
  initialZones: Zone[];
}

export function ZoneNotesManager({ initialZones }: ZoneNotesManagerProps) {
  const [noteText, setNoteText] = useState('');
  const [visibleToUser, setVisibleToUser] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAddNote = (zoneId: string) => {
    if (!noteText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Note is empty',
        description: 'Please enter a note to add.',
      });
      return;
    }
    startTransition(async () => {
      const result = await addZoneNoteAction(zoneId, noteText, visibleToUser);
      if (result.success) {
        toast({
          title: 'Note Added',
          description: 'The note has been successfully added to the zone.',
        });
        setNoteText('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
    });
  };

  const handleDeleteNote = (zoneId: string, noteId: string) => {
    startTransition(async () => {
      const result = await deleteZoneNoteAction(zoneId, noteId);
      if (result.success) {
        toast({
          title: 'Note Deleted',
          description: 'The note has been removed.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zone Notes</CardTitle>
        <CardDescription>
          Add, view, and manage notes for each zone. Visible notes will be shown to users on their map.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {initialZones.map((zone) => (
            <AccordionItem value={zone.id} key={zone.id}>
              <AccordionTrigger className='font-bold'>{zone.name}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {/* Add new note form */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-semibold">Add New Note</h4>
                    <div className="space-y-2">
                      <Label htmlFor={`note-text-${zone.id}`}>Note Content</Label>
                      <Input
                        id={`note-text-${zone.id}`}
                        placeholder="e.g., Slippery floor"
                        onChange={(e) => setNoteText(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`visible-switch-${zone.id}`}
                        checked={visibleToUser}
                        onCheckedChange={setVisibleToUser}
                        disabled={isPending}
                      />
                      <Label htmlFor={`visible-switch-${zone.id}`}>Visible to Users</Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddNote(zone.id)}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Add Note
                    </Button>
                  </div>
                  {/* Existing notes list */}
                  <div className="space-y-2">
                     <h4 className="font-semibold">Existing Notes</h4>
                     {zone.notes && zone.notes.length > 0 ? (
                        zone.notes.map((note) => (
                            <div key={note.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                                <div className='flex items-center gap-4'>
                                   <Badge variant={note.visibleToUser ? 'default' : 'secondary'}>
                                        {note.visibleToUser ? <Eye className="mr-2 h-3 w-3" /> : <EyeOff className="mr-2 h-3 w-3" />}
                                        {note.visibleToUser ? 'Visible' : 'Hidden'}
                                   </Badge>
                                   <p className="text-sm">{note.text}</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isPending}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete this note. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteNote(zone.id, note.id)} className="bg-destructive hover:bg-destructive/90">
                                                Delete Note
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                     ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No notes for this zone.</p>
                     )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
