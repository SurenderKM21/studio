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
  const hasFocusedRef = useRef(false);
  const currentZoneIdRef = useRef(null);

  // Initialize admin location for fallback centering
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

  // Use fitBounds to strictly focus on the zone coordinates
  const focusOnZone = useCallback(() => {
    if (!mapInstance || !coordinates || coordinates.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    
    // fitBounds is much more reliable than panTo for centering shapes
    mapInstance.fitBounds(bounds);
    
    // If it's a very tight zone, prevent extreme zoom
    const listener = window.google.maps.event.addListener(mapInstance, 'idle', () => {
      if (mapInstance.getZoom() > 20) mapInstance.setZoom(19);
      window.google.maps.event.removeListener(listener);
    });
  }, [mapInstance, coordinates]);

  // Focus when map instance is ready or coordinates change initially
  useEffect(() => {
    if (mapInstance && coordinates && coordinates.length > 0) {
      const zoneFingerprint = JSON.stringify(coordinates);
      if (currentZoneIdRef.current !== zoneFingerprint) {
        focusOnZone();
        currentZoneIdRef.current = zoneFingerprint;
      }
    }
  }, [mapInstance, coordinates, focusOnZone]);

  const handleMapClick = (event) => {
    if (coordinates.length < 10 && event.latLng) {
      const newCoord = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      onCoordinatesChange([...coordinates, newCoord]);
    }
  };

  const handleMarkerDragEnd = (index, event) => {
    if (event.latLng) {
      const newCoords = [...coordinates];
      newCoords[index] = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      onCoordinatesChange(newCoords);
    }
  };

  const clearCoordinates = () => {
    onCoordinatesChange([]);
    currentZoneIdRef.current = null;
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
        center={coordinates.length > 0 ? coordinates[0] : (adminLocation || defaultCenter)}
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

        {adminLocation && (
          <Marker 
            position={adminLocation} 
            icon={userMarkerOptions}
            zIndex={0}
            title="Your Location"
          />
        )}
      </GoogleMap>
      
      <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
        Drag markers to adjust. Sequence is numbered. The map centers on the zone shape automatically.
      </p>
    </div>
  );
}
