'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Zone, AppSettings, RouteDetails, User } from '@/lib/types';
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
  settings: AppSettings;
}

// Mock user for demonstration. In a real app, this would come from auth.
const MOCK_USER: User = { id: 'user-1', name: 'John Doe' };
const UPDATE_INTERVAL_MS = 30000; // 30 seconds

export function UserDashboard({ initialZones, settings }: UserDashboardProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentZone, setCurrentZone] = useState<{ zoneId: string; zoneName: string} | null>(null);
  const [isPlanning, startRoutePlanning] = useTransition();
  const [isClassifying, startClassification] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        toast({
          variant: "destructive",
          title: "Unsupported Browser",
          description: "Your browser does not support geolocation.",
        });
        return;
      }

      const handleSuccess = (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;

        // Send data to admin view
        updateUserLocationAction(MOCK_USER.id, MOCK_USER.name, latitude, longitude);

        // Identify and update the user's current zone
        identifyUserZoneAction(latitude, longitude).then(result => {
          if (result.data) {
            setCurrentZone(prevZone => {
              if (prevZone?.zoneId !== result.data.zoneId && result.data.zoneId !== 'unknown') {
                toast({
                  title: "You've entered a new zone!",
                  description: `You are now in: ${result.data.zoneName}`,
                });
              }
              return result.data;
            });
          }
        });
      };

      const handleError = (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error);
        let description = "Could not get your location. Please ensure location services are enabled.";
        if (error.code === error.PERMISSION_DENIED) {
          description = "Location permission denied. Please enable it in your browser settings to use this feature.";
        }
        toast({
          variant: "destructive",
          title: "Location Error",
          description: description,
        });
      };
      
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    };
    
    // Get initial position immediately after login.
    getLocation();

    // Set an interval to send updates every 30 seconds.
    const intervalId = setInterval(getLocation, UPDATE_INTERVAL_MS);

    // Clean up the interval when the component unmounts.
    return () => clearInterval(intervalId);
  }, [toast]);


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
        // A full implementation would re-fetch, but here we'll just update state
        const updatedZones = zones.map(z => {
            const classification = result.classifications?.find(c => c.zoneId === z.id);
            return classification ? { ...z, density: classification.density } : z;
        });
        setZones(updatedZones);
        toast({
          title: 'Densities Updated',
          description: 'Zone crowd levels have been re-calculated.',
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
        <LocationTracker currentZoneName={currentZone?.zoneName ?? 'Locating...'} />
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
