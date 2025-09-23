
'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import type { Zone, RouteDetails, User } from '@/lib/types';
import { MapView } from './map-view';
import { RoutePlanner } from './route-planner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RouteInfo } from './route-info';
import { Button } from '../ui/button';
import { Loader, RefreshCw } from 'lucide-react';
import { classifyAllZonesAction, getRouteAction, identifyUserZoneAction, updateUserLocationAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { DensityLegend } from './density-legend';
import { LocationTracker } from './location-tracker';

interface UserDashboardProps {
  initialZones: Zone[];
  initialUser: User;
}

const UPDATE_INTERVAL_MS = 30000; // 30 seconds

export function UserDashboard({ initialZones, initialUser }: UserDashboardProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentZone, setCurrentZone] = useState<{ zoneId: string; zoneName: string} | null>(null);
  const [isPlanning, startRoutePlanning] = useTransition();
  const [isClassifying, startClassification] = useTransition();
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Zones are passed as props and will be updated by server-side revalidation
    setZones(initialZones);
  }, [initialZones]);

  const getLocationAndUpdate = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Unsupported Browser",
        description: "Your browser does not support geolocation.",
      });
      return;
    }
    
    setIsSendingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        Promise.all([
           updateUserLocationAction(initialUser.id, initialUser.name, latitude, longitude, initialUser.groupSize),
           identifyUserZoneAction(latitude, longitude)
        ]).then(([locationUpdateResult, zoneResult]) => {
            setLastLocationUpdate(new Date());

            if (zoneResult.data) {
              const newZone = zoneResult.data;
              if (currentZone?.zoneId !== newZone.zoneId && newZone.zoneId !== 'unknown') {
                toast({
                  title: "You've entered a new zone!",
                  description: `You are now in: ${newZone.zoneName}`,
                });
              }
              setCurrentZone(newZone);
            }
        }).catch((err) => {
           console.error("Error updating location or zone:", err);
           toast({
              variant: "destructive",
              title: "Update Error",
              description: "Failed to update location or identify zone.",
          });
        }).finally(() => {
           setIsSendingLocation(false);
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let description = "Could not get your location. Please ensure location services are enabled.";
        if (error?.code === error.PERMISSION_DENIED) {
          description = "Location permission denied. Please enable it in your browser settings to use this feature.";
        }
        toast({
          variant: "destructive",
          title: "Location Error",
          description,
        });
        setIsSendingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [toast, initialUser.id, initialUser.name, initialUser.groupSize, currentZone?.zoneId]);
  
  useEffect(() => {
    // We wrap this in a timeout to ensure it runs after the initial render.
    const initialTimeout = setTimeout(() => {
      getLocationAndUpdate();
      intervalRef.current = setInterval(getLocationAndUpdate, UPDATE_INTERVAL_MS);
    }, 100);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [getLocationAndUpdate]);


  const handlePlanRoute = (sourceZone: string, destinationZone: string) => {
    startRoutePlanning(async () => {
      setRouteDetails(null);
      const result = await getRouteAction(sourceZone, destinationZone);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Routing Error',
          description: result.error,
        });
      } else {
        setRouteDetails(result.data!);
        toast({
          title: 'Route Found!',
          description: 'Displaying the most optimal path.',
        });
      }
    });
  };

  const handleClassifyZones = () => {
    startClassification(async () => {
      const result = await classifyAllZonesAction();
       if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Classification Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Densities Updated',
          description: 'Zone crowd levels have been re-calculated. The map will update on the next data refresh.',
        });
      }
    });
  }

  return (
    <div>
       <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold">Event Navigator</h1>
          <p className="text-muted-foreground">
            Find the best path through the event.
          </p>
        </div>
         <Button onClick={handleClassifyZones} disabled={isClassifying}>
           {isClassifying ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Update Crowd Levels
        </Button>
      </div>

    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 flex flex-col gap-8">
        <LocationTracker 
            currentZoneName={currentZone?.zoneName ?? 'Locating...'} 
            isSending={isSendingLocation}
            lastUpdated={lastLocationUpdate}
        />
        <RoutePlanner
          zones={zones}
          onPlanRoute={handlePlanRoute}
          isPlanning={isPlanning}
        />
        <RouteInfo routeDetails={routeDetails} isPlanning={isPlanning} zones={zones} />
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full min-h-[600px] shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Event Map</CardTitle>
                <DensityLegend />
            </div>
          </CardHeader>
          <CardContent>
            <MapView zones={zones} route={routeDetails?.route ?? []} alternativeRoute={routeDetails?.alternativeRoute ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
