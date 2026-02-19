
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import { Zone } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface AlertManagerProps {
  zones: Zone[];
}

export function AlertManager({ zones }: AlertManagerProps) {
  const [message, setMessage] = useState('');
  const [zoneId, setZoneId] = useState('all');
  const { toast } = useToast();
  const db = useFirestore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Alert message cannot be empty.',
      });
      return;
    }

    const alertsRef = collection(db, 'alerts');
    addDocumentNonBlocking(alertsRef, {
      message,
      timestamp: new Date().toISOString(),
      zoneId: zoneId === 'all' ? null : zoneId
    });

    toast({
      title: 'Alert Sent!',
      description: zoneId === 'all' ? 'Broadcast to all users.' : 'Sent to selected zone.',
    });
    setMessage('');
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Send Alert</CardTitle>
          <CardDescription>
            Broadcast an important message. By default it goes to all users, or you can select a specific zone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full gap-2">
            <Label htmlFor="zoneId">Target Zone</Label>
            <Select onValueChange={setZoneId} defaultValue={zoneId}>
                <SelectTrigger id="zoneId">
                    <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid w-full gap-2">
            <Label htmlFor="message">Alert Message</Label>
            <Textarea
              id="message"
              placeholder="Type your alert message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Users will need to acknowledge the alert to close it.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!message.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Send Alert
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
