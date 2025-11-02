'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LocationTrackerProps {
  currentZoneName: string;
  isSending: boolean;
  lastUpdated: Date | null;
}

export function LocationTracker({ currentZoneName, isSending, lastUpdated }: LocationTrackerProps) {
    const [online, setOnline] = useState(true);

    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        if (typeof navigator !== 'undefined') {
            setOnline(navigator.onLine);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getStatusText = () => {
        if (isSending) {
            return 'Sending location...';
        }
        if (lastUpdated) {
            return `Last update: ${lastUpdated.toLocaleTimeString()}`;
        }
        if (currentZoneName === 'Problem getting location') {
            return 'Could not determine your location. Please check browser permissions.';
        }
        return 'Your current zone is updated automatically.';
    }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Your Location</CardTitle>
        {online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {currentZoneName === 'Problem getting location' ? (
              <AlertTriangle className="h-8 w-8 text-destructive" />
          ) : (
             <MapPin className="h-8 w-8 text-primary" />
          )}

          {isSending ? (
            <Skeleton className="h-6 w-3/4" />
          ) : (
            <p className="text-2xl font-bold font-headline">{currentZoneName}</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground pt-2">
            {getStatusText()}
        </p>
      </CardContent>
    </Card>
  );
}
