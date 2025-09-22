'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AppSettings } from '@/lib/types';
import { useState, startTransition } from 'react';
import { updateSettingsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function SettingsPanel({
  initialSettings,
}: {
  initialSettings: AppSettings;
}) {
  const [interval, setInterval] = useState(initialSettings.updateInterval);
  const { toast } = useToast();

  const handleSave = () => {
    startTransition(() => {
      updateSettingsAction({ updateInterval: interval }).then(() => {
        toast({
          title: 'Settings Saved',
          description: 'The location update interval has been updated.',
        });
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>
          Adjust global settings for the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="interval-slider">
            User Location Update Interval:{' '}
            <span className="font-bold text-primary">{interval} seconds</span>
          </Label>
          <Slider
            id="interval-slider"
            min={30}
            max={300}
            step={15}
            value={[interval]}
            onValueChange={(value) => setInterval(value[0])}
          />
          <p className="text-sm text-muted-foreground">
            Sets how often user location data is collected. Minimum 30 seconds,
            maximum 5 minutes (300s).
          </p>
        </div>
        <Button onClick={handleSave}>Save Settings</Button>
      </CardContent>
    </Card>
  );
}
