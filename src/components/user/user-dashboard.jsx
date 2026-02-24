'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function isPointInPolygon(lat, lng, polygon) {
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

function calculateDensity(count, capacity) {
  const ratio = count / capacity;
  if (ratio >= 1) return 'over-crowded';
  if (ratio >= 0.7) return 'crowded';
  if (ratio >= 0.3) return 'moderate';
  return 'free';
}

const LAST_SEEN_ALERT_KEY = 'evacai-last-seen-alert-timestamp';

export function UserDashboard({ userId }) {
  const db = useFirestore();
  const sessionStartTime = useRef(new Date().toISOString());
  
  const zonesQuery = useMemoFirebase(() => collection(db, 'zones'), [db]);
  const { data: zonesData } = useCollection(zonesQuery);
  const zones = zonesData || [];

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: usersData } = useCollection(usersQuery);
  const users = usersData || [];

  const userRef = useMemoFirebase(() => doc(db, 'users', userId), [db, userId]);
  const { data: userProfile } = useDoc(userRef);

  const zonesRef = useRef([]);
  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  const enrichedZones = useMemo(() => {
    return zones.map(zone => {
      const count = users.filter(u => u.lastZoneId === zone.id && u.status === 'online').length;
      const isOverrideActive = zone.manualDensity && 
                               (zone.manualDensityAtCount === undefined || count === zone.manualDensityAtCount);
      const density = isOverrideActive ? zone.density : calculateDensity(count, zone.capacity);
      return { ...zone, userCount: count, density };
    });
  }, [zones, users]);

  const alertsQuery = useMemoFirebase(() => query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(5)), [db]);
  const { data: alertsData = [] } = useCollection(alertsQuery);

  const [routeDetails, setRouteDetails] = useState(null);
  const [routingError, setRoutingError] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);

  useEffect(() => {
    if (alertsData.length > 0 && userProfile) {
      const applicableAlert = alertsData[0];
      const lastSeen = localStorage.getItem(LAST_SEEN_ALERT_KEY);
      const isTargetedAtUser = !applicableAlert.zoneId || applicableAlert.zoneId === userProfile.lastZoneId;
      const isSentDuringSession = applicableAlert.timestamp > sessionStartTime.current;
      const isNotAcknowledged = applicableAlert.timestamp !== lastSeen;

      if (isTargetedAtUser && isSentDuringSession && isNotAcknowledged) {
        setLatestAlert(applicableAlert);
        setShowAlert(true);
      }
    }
  }, [alertsData, userProfile]);

  const handleAcknowledgeAlert = () => {
    if (latestAlert) localStorage.setItem(LAST_SEEN_ALERT_KEY, latestAlert.timestamp);
    setShowAlert(false);
  };

  const updateLocation = useCallback(async (lat, lng) => {
    setCurrentUserLocation({ lat, lng });
    
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
    
    if (userRef) {
      setDoc(userRef, userUpdate, { merge: true }).catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: userUpdate
        }));
      });
    }
  }, [userRef]);

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

  const handlePlanRoute = async (sourceZone, destinationZone) => {
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

  const getFriendlyZoneName = (zoneId) => {
      if (!zoneId) return 'Locating...';
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

      <div className="mb-6">
        <h1 className="text-4xl font-headline font-bold">Welcome, {userProfile?.name || 'User'}</h1>
        <p className="text-muted-foreground">Navigate smarter, not harder.</p>
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