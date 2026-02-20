
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Zone, RouteDetails, AlertMessage, User, DensityCategory, Coordinate } from '@/lib/types';
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
import { getRouteAction } from '@/lib/actions';
import { FirestorePermissionError } from '@/firebase/errors';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

// Helper for local zone identification (to avoid server action pings)
function isPointInPolygon(lat: number, lng: number, polygon: Coordinate[]) {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
}

function calculateDensity(count: number, capacity: number): DensityCategory {
  const ratio = count / capacity;
  if (ratio >= 1) return 'over-crowded';
  if (ratio >= 0.7) return 'crowded';
  if (ratio >= 0.3) return 'moderate';
  return 'free';
}

export function UserDashboard({ userId }: UserDashboardProps) {
  const db = useFirestore();
  
  // Real-time Firestore Queries
  const zonesQuery = useMemoFirebase(() => collection(db, 'zones'), [db]);
  const { data: zonesData } = useCollection(zonesQuery);
  const zones = (zonesData as Zone[]) || [];

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: usersData } = useCollection(usersQuery);
  const users = (usersData as User[]) || [];

  const userRef = useMemoFirebase(() => doc(db, 'users', userId), [db, userId]);
  const { data: userProfile } = useDoc(userRef);

  // Use refs to store latest data for the GPS watcher (to keep the watcher stable)
  const zonesRef = useRef<Zone[]>(zones);
  const userRefCurrent = useRef(userRef);

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  useEffect(() => {
    userRefCurrent.current = userRef;
  }, [userRef]);

  const enrichedZones = useMemo(() => {
    return zones.map(zone => {
      const count = users.filter(u => u.lastZoneId === zone.id && u.status === 'online').length;
      
      const isOverrideStale = zone.manualDensity && 
                              zone.manualDensityAtCount !== undefined && 
                              count !== zone.manualDensityAtCount;
      
      const density = (zone.manualDensity && !isOverrideStale) 
                      ? zone.density 
                      : calculateDensity(count, zone.capacity);
      
      return { ...zone, userCount: count, density, isOverrideStale };
    });
  }, [zones, users]);

  // Self-Healing Logic for overrides
  useEffect(() => {
    enrichedZones.forEach(zone => {
      if (zone.isOverrideStale) {
        const zoneRef = doc(db, 'zones', zone.id);
        updateDocumentNonBlocking(zoneRef, {
          manualDensity: false,
          manualDensityAtCount: null
        });
      }
    });
  }, [enrichedZones, db]);

  // Fetch the 5 most recent alerts
  const alertsQuery = useMemoFirebase(() => query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(5)), [db]);
  const { data: alertsData = [] } = useCollection(alertsQuery);
  const alerts = alertsData as AlertMessage[];

  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [latestAlert, setLatestAlert] = useState<AlertMessage | null>(null);
  const [mountedTime, setMountedTime] = useState<Date | null>(null);

  const sessionStartTime = useRef<Date>(new Date());
  const zoneEntryTime = useRef<Date>(new Date());
  const lastZoneId = useRef<string | null>(null);

  useEffect(() => {
    setMountedTime(new Date());
  }, []);

  useEffect(() => {
    if (userProfile?.lastZoneId && userProfile.lastZoneId !== lastZoneId.current) {
      zoneEntryTime.current = new Date();
      lastZoneId.current = userProfile.lastZoneId;
    }
  }, [userProfile?.lastZoneId]);

  useEffect(() => {
    if (alerts && alerts.length > 0 && userProfile) {
      const applicableAlert = alerts.find(alert => {
        const isTargeted = !alert.zoneId || alert.zoneId === userProfile.lastZoneId;
        if (!isTargeted) return false;

        const alertTime = new Date(alert.timestamp);
        const afterSessionStart = alertTime > sessionStartTime.current;
        const entryThreshold = new Date(zoneEntryTime.current.getTime() - 5000);
        const afterZoneEntry = alert.zoneId ? alertTime > entryThreshold : true;

        return afterSessionStart && afterZoneEntry;
      });

      if (applicableAlert) {
        const lastSeen = localStorage.getItem(LAST_SEEN_ALERT_KEY);
        if (applicableAlert.timestamp !== lastSeen) {
          setLatestAlert(applicableAlert);
          setShowAlert(true);
        }
      }
    }
  }, [alerts, userProfile]);

  const handleAcknowledgeAlert = () => {
    if (latestAlert) localStorage.setItem(LAST_SEEN_ALERT_KEY, latestAlert.timestamp);
    setShowAlert(false);
  };

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    setCurrentUserLocation({ lat, lng });
    
    // Identify zone locally on the client
    let identifiedZoneId = null;
    for (const zone of zonesRef.current) {
      if (isPointInPolygon(lat, lng, zone.coordinates)) {
        identifiedZoneId = zone.id;
        break;
      }
    }
    
    const userUpdate = {
      lastLatitude: lat,
      lastLongitude: lng,
      lastSeen: new Date().toISOString(),
      lastZoneId: identifiedZoneId || 'outside',
      status: 'online'
    };
    
    const currentRef = userRefCurrent.current;
    if (currentRef) {
      setDoc(currentRef, userUpdate, { merge: true }).catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: currentRef.path,
          operation: 'update',
          requestResourceData: userUpdate
        }));
      });
    }
  }, []);

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
    const result = await getRouteAction(sourceZone, destinationZone, enrichedZones);
    if (result.error) {
      setRoutingError(result.error);
    } else if (result.data) {
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
          <p className="text-muted-foreground">Navigate smarter, not harder.</p>
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
          <RoutePlanner zones={enrichedZones} onPlanRoute={handlePlanRoute} isPlanning={isPlanning} />
          <RouteInfo routeDetails={routeDetails} isPlanning={isPlanning} zones={enrichedZones} routingError={routingError} />
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[600px] shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Zone Map</CardTitle>
                <DensityLegend />
              </div>
            </CardHeader>
            <CardContent>
              <MapView zones={enrichedZones} route={routeDetails?.route ?? []} alternativeRoute={routeDetails?.alternativeRoute ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
