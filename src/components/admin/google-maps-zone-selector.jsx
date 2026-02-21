'use client';

import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
} from '@react-google-maps/api';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Trash2, AlertTriangle, MapPin, Focus } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 12.84,
  lng: 80.04,
};

const polygonOptions = {
  fillColor: '#ef4444',
  fillOpacity: 0.35,
  strokeColor: '#ef4444',
  strokeOpacity: 0.9,
  strokeWeight: 3,
  clickable: false,
  draggable: false,
  editable: false,
  geodesic: false,
  zIndex: 1,
};

export function GoogleMapsZoneSelector({
  coordinates,
  onCoordinatesChange,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });
  
  const [adminLocation, setAdminLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const lastFocusedRef = useRef('');

  // Get user location for fallback only
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAdminLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {}
      );
    }
  }, []);

  // Strict focus logic using LatLngBounds
  const focusOnZone = useCallback(() => {
    if (!mapInstance || !coordinates || coordinates.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    
    // fitBounds is the most reliable way to ignore "center" and show the specific area
    mapInstance.fitBounds(bounds);
    
    // Prevent excessive zoom for single points or small areas
    const listener = window.google.maps.event.addListener(mapInstance, 'idle', () => {
      if (mapInstance.getZoom() > 20) mapInstance.setZoom(19);
      window.google.maps.event.removeListener(listener);
    });
  }, [mapInstance, coordinates]);

  // Effect to handle initial load and snaps
  useEffect(() => {
    if (mapInstance && coordinates && coordinates.length > 0) {
      const currentHash = JSON.stringify(coordinates);
      // Only snap if coordinates actually changed (prevents snapping back while dragging)
      if (lastFocusedRef.current !== currentHash) {
        focusOnZone();
        lastFocusedRef.current = currentHash;
      }
    }
  }, [mapInstance, coordinates, focusOnZone]);

  const handleMapClick = (event) => {
    if (coordinates.length < 10 && event.latLng) {
      const newCoord = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      const updated = [...coordinates, newCoord];
      lastFocusedRef.current = JSON.stringify(updated); // Update ref so we don't snap back immediately
      onCoordinatesChange(updated);
    }
  };

  const handleMarkerDragEnd = (index, event) => {
    if (event.latLng) {
      const newCoords = [...coordinates];
      newCoords[index] = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      lastFocusedRef.current = JSON.stringify(newCoords); // Update ref so we don't snap back while editing
      onCoordinatesChange(newCoords);
    }
  };

  const clearCoordinates = () => {
    onCoordinatesChange([]);
    lastFocusedRef.current = '';
  };

  if (loadError) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h3 className="font-bold text-lg text-destructive">Maps Error</h3>
            <p className="text-sm text-muted-foreground">Check API Key and Referer Restrictions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }

  const userMarkerOptions = {
    path: 'M-10,0a10,10 0 1,0 20,0a10,10 0 1,0 -20,0',
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 2,
    scale: 0.6
  };

  // Determine initial map center strictly: Zone first, then Geolocation, then default
  const initialCenter = coordinates.length > 0 
    ? coordinates[0] 
    : (adminLocation || defaultCenter);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">
            {coordinates.length > 0 ? `${coordinates.length} points defined` : 'Click map to define zone'}
          </p>
        </div>
        <div className="flex gap-2">
          {coordinates.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={focusOnZone}
              title="Recenter on Zone"
            >
              <Focus className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearCoordinates}
            disabled={coordinates.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={18}
        onClick={handleMapClick}
        onLoad={(map) => setMapInstance(map)}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: false,
          mapTypeId: 'hybrid' 
        }}
      >
        {coordinates.map((pos, index) => (
          <Marker
            key={`marker-${index}-${pos.lat}-${pos.lng}`}
            position={pos}
            draggable={true}
            onDragEnd={(e) => handleMarkerDragEnd(index, e)}
            label={{
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        ))}

        {coordinates.length > 2 && (
          <Polygon paths={coordinates} options={polygonOptions} />
        )}

        {adminLocation && coordinates.length === 0 && (
          <Marker 
            position={adminLocation} 
            icon={userMarkerOptions}
            zIndex={0}
            title="Your Current Location"
          />
        )}
      </GoogleMap>
      
      <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
        The map automatically snaps to the zone shape. Drag numbered red markers to adjust boundaries.
      </p>
    </div>
  );
}
