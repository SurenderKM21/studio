'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Zone, AppSettings, RouteDetails, DensityCategory } from '@/lib/types';
import { MapView } from './map-view';
import { RoutePlanner } from './route-planner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RouteInfo } from './route-info';
import { Button } from '../ui/button';
import { Loader, RefreshCw } from 'lucide-react';
import { classifyAllZonesAction, getRouteAction, identifyUserZoneAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { DensityLegend } from './density-legend';
import { LocationTracker } from './location-tracker';

interface UserDashboardProps {
  initialZones: Zone[];
  settings: AppSettings;
}

export function UserDashboard({ initialZones, settings }: UserDashboardProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentZone, setCurrentZone] = useState<{ zoneId: string; zoneName: string} | null>(null);
  const [isPlanning, startRoutePlanning] = useTransition();
  const [isClassifying, startClassification] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const handleNewPosition = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      identifyUserZoneAction(latitude, longitude).then(result => {
        if (result.data) {
          setCurrentZone(result.data);
          // Optional: toast to inform user of zone change
          if (result.data.zoneId !== currentZone?.zoneId) {
             toast({
              title: "You've entered a new zone!",
              description: `You are now in: ${result.data.zoneName}`,
            });
          }
        }
      });
    };

    if ('geolocation' in navigator) {
      const intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(handleNewPosition, (error) => {
          console.error("Geolocation error:", error);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not get your location. Please ensure location services are enabled."
          })
        });
      }, settings.updateInterval * 1000); // Using interval from settings

      return () => clearInterval(intervalId);
    }
  }, [settings.updateInterval, toast, currentZone?.zoneId]);


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
