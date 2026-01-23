
'use client';

import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
} from '@react-google-maps/api';
import { useState, useCallback } from 'react';
import type { Coordinate } from '@/lib/types';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

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

interface GoogleMapsZoneSelectorProps {
  coordinates: Coordinate[];
  onCoordinatesChange: (coords: Coordinate[]) => void;
}

export function GoogleMapsZoneSelector({
  coordinates,
  onCoordinatesChange,
}: GoogleMapsZoneSelectorProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (coordinates.length < 4 && event.latLng) {
      const newCoord = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      onCoordinatesChange([...coordinates, newCoord]);
    }
  };

  const handleMarkerDragEnd = (
    index: number,
    event: google.maps.MapMouseEvent
  ) => {
    if (event.latLng) {
      const newCoords = [...coordinates];
      newCoords[index] = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      onCoordinatesChange(newCoords);
    }
  };

  const clearCoordinates = () => {
    onCoordinatesChange([]);
  };

  if (!isLoaded) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }
  
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="h-[400px] w-full rounded-md border-2 border-dashed flex items-center justify-center text-center p-4">
          <p className="text-destructive font-semibold">
              Google Maps API Key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file to use this feature.
          </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Define Zone on Map</p>
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
        center={defaultCenter}
        zoom={13}
        onClick={handleMapClick}
      >
        {coordinates.map((pos, index) => (
          <Marker
            key={index}
            position={pos}
            draggable={true}
            onDragEnd={(e) => handleMarkerDragEnd(index, e)}
          />
        ))}
        {coordinates.length > 2 && (
          <Polygon paths={coordinates} options={polygonOptions} />
        )}
      </GoogleMap>
      <p className="text-xs text-muted-foreground">
        Click on the map to add up to 4 corner points. Drag points to adjust.
      </p>
    </div>
  );
}
