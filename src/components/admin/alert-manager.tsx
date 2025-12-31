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
import { useState, useTransition } from 'react';
import { sendAlertAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader, Send } from 'lucide-react';

export function AlertManager() {
  const [message, setMessage] = useState('');
  const [isSending, startSending] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Alert message cannot be empty.',
      });
      return;
    }

    startSending(async () => {
      const result = await sendAlertAction(message);
      if (result.success) {
        toast({
          title: 'Alert Sent!',
          description: 'The alert has been broadcast to all users.',
        });
        setMessage('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Send Alert',
          description: result.error,
        });
      }
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Send Global Alert</CardTitle>
          <CardDescription>
            Broadcast an important message to all active users. This will appear as a popup on their screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full gap-2">
            <Label htmlFor="message">Alert Message</Label>
            <Textarea
              id="message"
              placeholder="Type your alert message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={isSending}
            />
             <p className="text-sm text-muted-foreground">
                Users will need to acknowledge the alert to close it.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSending || !message.trim()}>
            {isSending ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Alert
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
