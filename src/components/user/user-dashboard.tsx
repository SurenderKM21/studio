
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Zone, RouteDetails, AlertMessage } from '@/lib/types';
import { MapView } from './map-view';
import { RoutePlanner } from './route-planner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RouteInfo } from './route-info';
import { Siren } from 'lucide-react';
import { DensityLegend } from './density-legend';
import { LocationTracker } from './location-tracker';
import { SOSButton } from './sos-button';
import { 
  useCollection, 
  useDoc, 
  useMemoFirebase, 
  useFirestore, 
  errorEmitter 
} from '@/firebase';
import { collection, doc, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { getRouteAction, identifyZoneAction } from '@/lib/actions';
import { FirestorePermissionError } from '@/firebase/errors';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserDashboardProps {
  userId: string;
}

const LAST_SEEN_ALERT_KEY = 'evacai-last-seen-alert-timestamp';

export function UserDashboard({ userId }: UserDashboardProps) {
  const db = useFirestore();
  
  // Real-time Firestore Queries
  const zonesQuery = useMemoFirebase(() => collection(db, 'zones'), [db]);
  const { data: zonesData } = useCollection(zonesQuery);
  const zones = (zonesData as Zone[]) || [];

  const userRef = useMemoFirebase(() => doc(db, 'users', userId), [db, userId]);
  const { data: userProfile } = useDoc(userRef);

  const alertsQuery = useMemoFirebase(() => query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(1)), [db]);
  const { data: alertsData = [] } = useCollection(alertsQuery);
  const alerts = alertsData as AlertMessage[];

  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [latestAlert, setLatestAlert] = useState<AlertMessage | null>(null);
  const [mountedTime, setMountedTime] = useState<Date | null>(null);

  useEffect(() => {
    // Avoid hydration mismatch by setting time after mount
    setMountedTime(new Date());
  }, []);

  // Alert Handling
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const newAlert = alerts[0];
      const lastSeen = localStorage.getItem(LAST_SEEN_ALERT_KEY);
      if (newAlert.timestamp !== lastSeen) {
        setLatestAlert(newAlert);
        setShowAlert(true);
      }
    }
  }, [alerts]);

  const handleAcknowledgeAlert = () => {
    if (latestAlert) localStorage.setItem(LAST_SEEN_ALERT_KEY, latestAlert.timestamp);
    setShowAlert(false);
  };

  // Location Tracking & Zone Identification
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    setCurrentUserLocation({ lat, lng });
    
    // Identify which zone the user is currently in
    const identifiedZoneId = await identifyZoneAction(lat, lng, zones);
    
    const userUpdate = {
      lastLatitude: lat,
      lastLongitude: lng,
      lastSeen: new Date().toISOString(),
      lastZoneId: identifiedZoneId || 'outside',
      status: 'online'
    };
    
    setDoc(userRef, userUpdate, { merge: true }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: userUpdate
      }));
    });
  }, [userRef, zones]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [updateLocation]);

  const handlePlanRoute = async (sourceZone: string, destinationZone: string) => {
    setIsPlanning(true);
    setRouteDetails(null);
    setRoutingError(null);
    // Use zones from current cloud state
    const result = await getRouteAction(sourceZone, destinationZone, zones);
    if (result.error) {
      setRoutingError(result.error);
    } else {
      setRouteDetails(result.data);
    }
    setIsPlanning(false);
  };

  const getFriendlyZoneName = (zoneId: string | undefined) => {
      if (!zoneId || zoneId === 'Locating...') return 'Locating...';
      if (zoneId === 'outside') return 'Outside Event Area';
      return zones.find(z => z.id === zoneId)?.name || 'Outside Event Area';
  }

  return (
    <div>
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Emergency Alert</AlertDialogTitle>
            <AlertDialogDescription>{latestAlert?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleAcknowledgeAlert}>Acknowledge</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold">Event Navigator</h1>
          <p className="text-muted-foreground">Live Cloud Sync Active</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card className="border-destructive border-2 bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Siren className="h-6 w-6" /> SOS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SOSButton userId={userId} initialSOSState={userProfile?.sos ?? false} />
            </CardContent>
          </Card>
          <LocationTracker 
            currentZoneName={getFriendlyZoneName(userProfile?.lastZoneId)} 
            isSending={false}
            lastUpdated={mountedTime}
            coordinates={currentUserLocation}
          />
          <RoutePlanner zones={zones} onPlanRoute={handlePlanRoute} isPlanning={isPlanning} />
          <RouteInfo routeDetails={routeDetails} isPlanning={isPlanning} zones={zones} routingError={routingError} />
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[600px] shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Cloud Map</CardTitle>
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
