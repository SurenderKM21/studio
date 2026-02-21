'use client';

import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
} from '@react-google-maps/api';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Trash2, AlertTriangle, MapPin } from 'lucide-react';
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
  fillColor: 'hsl(var(--primary))',
  fillOpacity: 0.3,
  strokeColor: 'hsl(var(--primary))',
  strokeOpacity: 0.8,
  strokeWeight: 2,
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

  // Initialize admin location
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAdminLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Ignore if location not shared
        }
      );
    }
  }, []);

  // Determine the initial center: Priority 1: Existing coords, Priority 2: Admin loc, Priority 3: Default
  const mapCenter = useMemo(() => {
    if (coordinates && coordinates.length > 0) {
      return coordinates[0];
    }
    return adminLocation || defaultCenter;
  }, [coordinates, adminLocation]);

  const handleMapClick = (event) => {
    if (coordinates.length < 4 && event.latLng) {
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
  };

  if (loadError) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h3 className="font-bold text-lg text-destructive">Google Maps Authorization Error</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>The site URL is not authorized for the provided Google Maps API Key.</p>
              <p className="font-mono bg-muted p-2 rounded text-xs break-all">
                {typeof window !== 'undefined' ? window.location.origin : 'Current domain'}
              </p>
              <p>Please update your API Key restrictions in the <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a> to allow this referer.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }

  const blueDot = {
    path: 'M-10,0a10,10 0 1,0 20,0a10,10 0 1,0 -20,0',
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 2,
    scale: 0.8
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">
            {coordinates.length > 0 ? 'Edit Zone Boundaries' : 'Define Zone on Map'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCoordinates}
          disabled={coordinates.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Points
        </Button>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={16}
        onClick={handleMapClick}
        onLoad={(map) => setMapInstance(map)}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {coordinates.map((pos, index) => (
          <Marker
            key={`${index}-${pos.lat}-${pos.lng}`}
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
            title="Your Location"
            icon={blueDot}
            zIndex={0}
          />
        )}
      </GoogleMap>
      <p className="text-xs text-muted-foreground">
        {coordinates.length < 4 
          ? 'Click on the map to add points (max 4). Drag existing markers to adjust boundary.'
          : 'Max points reached. Drag markers to fine-tune the zone shape.'}
      </p>
    </div>
  );
}
