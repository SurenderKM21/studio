
'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import type { Zone, RouteDetails, User, AppSettings, AlertMessage } from '@/lib/types';
import { MapView } from './map-view';
import { RoutePlanner } from './route-planner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RouteInfo } from './route-info';
import { Button } from '../ui/button';
import { Loader, RefreshCw } from 'lucide-react';
import { classifyAllZonesAction, getRouteAction, updateUserLocationAndClassifyZonesAction, refreshDataAction, getLatestAlertAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { DensityLegend } from './density-legend';
import { LocationTracker } from './location-tracker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface UserDashboardProps {
  initialZones: Zone[];
  initialUser: User;
  settings: AppSettings;
}

const LAST_SEEN_ALERT_KEY = 'evacai-last-seen-alert-timestamp';
export const SESSION_LOGIN_TIMESTAMP_KEY = 'evacai-session-login-timestamp';

// Function to play sound and vibrate
const triggerEmergencyNotification = () => {
  // 1. Vibration
  if (navigator.vibrate) {
    // Vibrate for 500ms, pause 100ms, vibrate 500ms
    navigator.vibrate([500, 100, 500]);
  }

  // 2. Sound
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A high-pitched beep (A5)
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5); // Play for 0.5 seconds
  } catch (e) {
    console.error("Could not play alert sound:", e);
  }
};


export function UserDashboard({ initialZones, initialUser, settings }: UserDashboardProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentZoneName, setCurrentZoneName] = useState<string>('Locating...');
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPlanning, startRoutePlanning] = useTransition();
  const [isClassifying, startClassification] = useTransition();
  const [isSendingLocation, setIsSendingLocation] = useState(true); // Start as true
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [latestAlert, setLatestAlert] = useState<AlertMessage | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // This effect keeps the component's state in sync with server-sent props
  useEffect(() => {
    setZones(initialZones);
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [initialZones]);

  const getLocationAndUpdate = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Unsupported Browser",
        description: "Your browser does not support geolocation.",
      });
      setCurrentZoneName('Problem getting location');
      setIsSendingLocation(false);
      return;
    }
    
    setIsSendingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentUserLocation({ lat: latitude, lng: longitude });
        
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
                const previousZoneName = currentZoneName;
                const newZoneName = newZone.zoneId === 'unknown' ? 'Not in a designated zone' : newZone.zoneName;
                
                setCurrentZoneName(newZoneName);
                
                // Only show toast if user enters a *known* zone that is different from the previous one
                if (newZone.zoneId !== 'unknown' && newZone.zoneName !== previousZoneName) {
                    toast({
                        title: "You've entered a new zone!",
                        description: `You are now in: ${newZone.zoneName}`,
                    });
                }
            } else {
                setCurrentZoneName('Not in a designated zone');
            }
        }).catch((err) => {
           toast({
              variant: "destructive",
              title: "Update Error",
              description: err.message || "Failed to update location and classify zones.",
          });
           setCurrentZoneName('Problem getting location');
           setCurrentUserLocation(null);
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
        setCurrentZoneName('Problem getting location');
        setCurrentUserLocation(null);
        setIsSendingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [toast, initialUser.id, initialUser.name, initialUser.groupSize, currentZoneName]);
  
  const checkForNewAlert = useCallback(async () => {
    const result = await getLatestAlertAction();
    if (result.data) {
        const newAlert = result.data;
        const lastSeenTimestamp = localStorage.getItem(LAST_SEEN_ALERT_KEY);
        const loginTimestamp = sessionStorage.getItem(SESSION_LOGIN_TIMESTAMP_KEY);

        // Check 1: Is this an alert the user has already seen in this session?
        if (newAlert.timestamp === lastSeenTimestamp) {
            return;
        }

        // Check 2: Was the alert sent *before* this user logged in? If so, ignore it.
        if (loginTimestamp && newAlert.timestamp < loginTimestamp) {
            return;
        }

        const isGlobalAlert = !newAlert.zoneId;
        const isUserInTargetedZone = newAlert.zoneId && initialUser.lastZoneId === newAlert.zoneId;

        if (isGlobalAlert || isUserInTargetedZone) {
            setLatestAlert(newAlert);
            setShowAlert(true);
            triggerEmergencyNotification(); // Vibrate and play sound
        }
    }
  }, [initialUser.lastZoneId]);

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

  // Effect for periodically refreshing all data
  useEffect(() => {
    const refreshData = async () => {
      await refreshDataAction();
      setLastSyncTime(new Date().toLocaleTimeString());
    };

    dataRefreshIntervalRef.current = setInterval(refreshData, 15000); // e.g., every 15 seconds

    return () => {
      if (dataRefreshIntervalRef.current) {
        clearInterval(dataRefreshIntervalRef.current);
      }
    }
  }, []);
  
  // Effect for checking for new alerts in near real-time
  useEffect(() => {
    // Check immediately on load
    checkForNewAlert();
    // Then check every 5 seconds
    alertIntervalRef.current = setInterval(checkForNewAlert, 5000);

    return () => {
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
      }
    };
  }, [checkForNewAlert]);

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

  const handleAcknowledgeAlert = () => {
    if (latestAlert) {
      localStorage.setItem(LAST_SEEN_ALERT_KEY, latestAlert.timestamp);
    }
    setShowAlert(false);
  };

  return (
    <div>
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Important Alert</AlertDialogTitle>
            <AlertDialogDescription>
              {latestAlert?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleAcknowledgeAlert} className="bg-destructive hover:bg-destructive/90">
            Acknowledge
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

       <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold">Event Navigator</h1>
          <p className="text-muted-foreground">
            Find the best path through the event. Last sync: {lastSyncTime}
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
            currentZoneName={currentZoneName} 
            isSending={isSendingLocation}
            lastUpdated={lastLocationUpdate}
            coordinates={currentUserLocation}
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
