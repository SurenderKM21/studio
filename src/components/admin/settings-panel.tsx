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
import { Input } from '../ui/input';

export function SettingsPanel({
  initialSettings,
}: {
  initialSettings: AppSettings;
}) {
  const { toast } = useToast();
  const [interval, setInterval] = useState(initialSettings.locationUpdateInterval || 30);
  const [threshold, setThreshold] = useState(initialSettings.zoneSnappingThreshold || 15);


  const handleSave = () => {
    startTransition(() => {
        updateSettingsAction({
            locationUpdateInterval: interval,
            zoneSnappingThreshold: threshold
        }).then(() => {
            toast({
                title: 'Settings Saved',
                description: 'The new settings have been applied.',
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
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="update-interval">Location Update Interval (seconds)</Label>
          <p className="text-sm text-muted-foreground">
            How often to fetch a user's location. Shorter intervals are more accurate but use more battery.
          </p>
          <div className="flex items-center gap-4">
            <Slider
              id="update-interval"
              min={10}
              max={300}
              step={10}
              value={[interval]}
              onValueChange={(value) => setInterval(value[0])}
            />
            <Input 
              type="number" 
              className="w-24"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              min={10}
              max={300}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="snapping-threshold">Zone Snapping Threshold (meters)</Label>
           <p className="text-sm text-muted-foreground">
            If a user is outside any zone, they will be "snapped" to the nearest zone if they are within this distance.
          </p>
          <div className="flex items-center gap-4">
            <Slider
              id="snapping-threshold"
              min={5}
              max={50}
              step={1}
              value={[threshold]}
              onValueChange={(value) => setThreshold(value[0])}
            />
             <Input 
              type="number" 
              className="w-24"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              min={5}
              max={50}
            />
          </div>
        </div>
        
        <Button onClick={handleSave}>Save Settings</Button>
      </CardContent>
    </Card>
  );
}
