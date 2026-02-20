'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { updateSettingsAction } from '@/lib/actions';
import { Settings } from 'lucide-react';

/**
 * Legacy wrapper for system settings. 
 * Resolves to actions.ts automatically.
 */
export function SettingsPanel({ initialSettings = {} }) {
  const [interval, setIntervalValue] = useState(initialSettings.locationUpdateInterval || 30);
  const [threshold, setThreshold] = useState(initialSettings.zoneSnappingThreshold || 15);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSave = () => {
    startTransition(async () => {
      await updateSettingsAction({
        locationUpdateInterval: interval,
        zoneSnappingThreshold: threshold
      });
      toast({
        title: 'Settings Saved',
        description: 'Global app preferences have been updated.',
      });
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <CardTitle>System Settings</CardTitle>
          </div>
          <CardDescription>Adjust global behavioral settings for the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="update-interval">Location Update Interval (seconds): {interval}s</Label>
            <Slider
              id="update-interval"
              min={10}
              max={300}
              step={10}
              value={[interval]}
              onValueChange={(value) => setIntervalValue(value[0])}
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="snapping-threshold">Zone Snapping Threshold (meters): {threshold}m</Label>
            <Slider
              id="snapping-threshold"
              min={5}
              max={50}
              step={1}
              value={[threshold]}
              onValueChange={(value) => setThreshold(value[0])}
            />
          </div>
          
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
