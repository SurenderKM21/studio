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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
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
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ZoneNotesManagerProps {
  initialZones: Zone[];
}

export function ZoneNotesManager({ initialZones }: ZoneNotesManagerProps) {
  const [noteText, setNoteText] = useState('');
  const [visibleToUser, setVisibleToUser] = useState(true);
  const { toast } = useToast();
  const db = useFirestore();

  const handleAddNote = (zoneId: string, currentNotes: ZoneNote[] = []) => {
    if (!noteText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Note is empty',
        description: 'Please enter a note to add.',
      });
      return;
    }

    const newNote = {
      id: `note-${Date.now()}`,
      text: noteText,
      visibleToUser,
      createdAt: new Date().toISOString(),
    };

    const zoneRef = doc(db, 'zones', zoneId);
    updateDocumentNonBlocking(zoneRef, {
      notes: [...currentNotes, newNote]
    });

    toast({
      title: 'Note Added',
      description: 'The note is being broadcast to all users.',
    });
    setNoteText('');
  };

  const handleDeleteNote = (zoneId: string, noteId: string, currentNotes: ZoneNote[] = []) => {
    const zoneRef = doc(db, 'zones', zoneId);
    updateDocumentNonBlocking(zoneRef, {
      notes: currentNotes.filter(n => n.id !== noteId)
    });

    toast({
      title: 'Note Deleted',
      description: 'The note has been removed.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zone Notes & Safety Alerts</CardTitle>
        <CardDescription>
          Add and manage notes for each zone. Notes marked as "Visible" will appear in the map tooltips for all users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {initialZones.map((zone) => (
            <AccordionItem value={zone.id} key={zone.id}>
              <AccordionTrigger className='font-bold'>{zone.name}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                    <h4 className="font-semibold">Add New Note for {zone.name}</h4>
                    <div className="space-y-2">
                      <Label htmlFor={`note-text-${zone.id}`}>Note Content</Label>
                      <Input
                        id={`note-text-${zone.id}`}
                        placeholder="e.g., Use Exit B for quicker access"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`visible-switch-${zone.id}`}
                        checked={visibleToUser}
                        onCheckedChange={setVisibleToUser}
                      />
                      <Label htmlFor={`visible-switch-${zone.id}`}>Visible to Users</Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddNote(zone.id, zone.notes || [])}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Save Note to Cloud
                    </Button>
                  </div>
                  <div className="space-y-2">
                     <h4 className="font-semibold">Existing Notes</h4>
                     {zone.notes && zone.notes.length > 0 ? (
                        zone.notes.map((note) => (
                            <div key={note.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                                <div className='flex items-center gap-4 flex-1'>
                                   <Badge variant={note.visibleToUser ? 'default' : 'secondary'}>
                                        {note.visibleToUser ? <Eye className="mr-2 h-3 w-3" /> : <EyeOff className="mr-2 h-3 w-3" />}
                                        {note.visibleToUser ? 'Visible' : 'Hidden'}
                                   </Badge>
                                   <p className="text-sm">{note.text}</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive ml-2">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will remove the note from the system. Users will no longer see it.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteNote(zone.id, note.id, zone.notes || [])} className="bg-destructive hover:bg-destructive/90">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                     ) : (
                        <p className="text-sm text-muted-foreground text-center py-4 italic">No notes created for this zone yet.</p>
                     )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          {initialZones.length === 0 && (
             <div className="text-center py-8 text-muted-foreground italic">
                No zones available to add notes.
             </div>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
