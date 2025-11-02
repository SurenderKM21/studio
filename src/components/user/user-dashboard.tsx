
'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import type { Zone, RouteDetails, User, AppSettings } from '@/lib/types';
import { MapView } from './map-view';
import { RoutePlanner } from './route-planner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RouteInfo } from './route-info';
import { Button } from '../ui/button';
import { Loader, RefreshCw } from 'lucide-react';
import { classifyAllZonesAction, getRouteAction, updateUserLocationAndClassifyZonesAction, refreshDataAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { DensityLegend } from './density-legend';
import { LocationTracker } from './location-tracker';

interface UserDashboardProps {
  initialZones: Zone[];
  initialUser: User;
  settings: AppSettings;
}

export function UserDashboard({ initialZones, initialUser, settings }: UserDashboardProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentZone, setCurrentZone] = useState<{ zoneId: string; zoneName: string} | null>(null);
  const [isPlanning, startRoutePlanning] = useTransition();
  const [isClassifying, startClassification] = useTransition();
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // This effect keeps the component's state in sync with server-sent props
  useEffect(() => {
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
        
        updateUserLocationAndClassifyZonesAction(
            initialUser.id, 
            initialUser.name, 
            latitude, 
            longitude, 
            initialUser.groupSize
        ).then((result) => {
            if (result.error) {
                throw new Error(result.error);
            }
            const { zones: updatedZones, currentZone: newZone } = result.data!;
            
            setLastLocationUpdate(new Date());
            setZones(updatedZones); // Update the map with fresh data

            if (newZone) {
              // Only show toast if zone changes
              if (currentZone?.zoneId !== newZone.zoneId) {
                if (newZone.zoneId !== 'unknown') {
                   toast({
                    title: "You've entered a new zone!",
                    description: `You are now in: ${newZone.zoneName}`,
                  });
                }
              }
              setCurrentZone(newZone);
            }
        }).catch((err) => {
           toast({
              variant: "destructive",
              title: "Update Error",
              description: err.message || "Failed to update location and classify zones.",
          });
        }).finally(() => {
           setIsSendingLocation(false);
        });
      },
      (error) => {
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
  
  // Effect for sending user location updates
  useEffect(() => {
    const updateIntervalMs = (settings.locationUpdateInterval || 30) * 1000;
    
    // Initial call after a short delay
    const initialTimeout = setTimeout(() => {
      getLocationAndUpdate();
      // Then set up the interval
      locationIntervalRef.current = setInterval(getLocationAndUpdate, updateIntervalMs);
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(initialTimeout);
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [getLocationAndUpdate, settings.locationUpdateInterval]);

  // Effect for periodically refreshing all data to sync with admin changes
  useEffect(() => {
    const refreshData = async () => {
      // We don't need to show a toast every time, it's a background sync
      await refreshDataAction();
    };

    dataRefreshIntervalRef.current = setInterval(refreshData, 15000); // e.g., every 15 seconds

    return () => {
      if (dataRefreshIntervalRef.current) {
        clearInterval(dataRefreshIntervalRef.current);
      }
    }
  }, []);

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
          description: 'Zone crowd levels have been re-calculated and will appear shortly.',
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
            Find the best path through the event. Last sync: {new Date().toLocaleTimeString()}
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
            <MapView 
              zones={zones} 
              route={routeDetails?.route ?? []} 
              alternativeRoute={routeDetails?.alternativeRoute ?? []} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
