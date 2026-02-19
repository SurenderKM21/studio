
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Zone, RouteDetails, User, AppSettings, AlertMessage } from '@/lib/types';
import { MapView } from './map-view';
import { RoutePlanner } from './route-planner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { RouteInfo } from './route-info';
import { Button } from '../ui/button';
import { RefreshCw, Siren } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DensityLegend } from './density-legend';
import { LocationTracker } from './location-tracker';
import { SOSButton } from './sos-button';
import { 
  useCollection, 
  useDoc, 
  useMemoFirebase, 
  useFirestore, 
  errorEmitter, 
  FirestorePermissionError 
} from '@/firebase';
import { collection, doc, query, orderBy, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import { getRouteAction } from '@/lib/actions';

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

export function UserDashboard({ initialUser }: UserDashboardProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  // Real-time Firestore Queries
  const zonesQuery = useMemoFirebase(() => collection(db, 'zones'), [db]);
  const { data: zones = [] } = useCollection<Zone>(zonesQuery);

  const userRef = useMemoFirebase(() => doc(db, 'users', initialUser.id), [db, initialUser.id]);
  const { data: userProfile } = useDoc<User>(userRef);

  const alertsQuery = useMemoFirebase(() => query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(1)), [db]);
  const { data: alerts = [] } = useCollection<AlertMessage>(alertsQuery);

  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [currentZoneName, setCurrentZoneName] = useState<string>('Locating...');
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [latestAlert, setLatestAlert] = useState<AlertMessage | null>(null);

  // Alert Handling
  useEffect(() => {
    if (alerts.length > 0) {
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

  // Location Tracking
  const updateLocation = useCallback((lat: number, lng: number) => {
    setCurrentUserLocation({ lat, lng });
    const userUpdate = {
      ...initialUser,
      lastLatitude: lat,
      lastLongitude: lng,
      lastSeen: new Date().toISOString(),
      status: 'online'
    };
    
    setDoc(userRef, userUpdate, { merge: true }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: userUpdate
      }));
    });
  }, [userRef, initialUser]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [updateLocation]);

  const handlePlanRoute = async (sourceZone: string, destinationZone: string) => {
    setIsPlanning(true);
    setRouteDetails(null);
    setRoutingError(null);
    const result = await getRouteAction(sourceZone, destinationZone, zones);
    if (result.error) {
      setRoutingError(result.error);
    } else {
      setRouteDetails(result.data);
    }
    setIsPlanning(false);
  };

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
              <SOSButton userId={initialUser.id} initialSOSState={userProfile?.sos ?? false} />
            </CardContent>
          </Card>
          <LocationTracker 
            currentZoneName={currentZoneName} 
            isSending={false}
            lastUpdated={new Date()}
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
