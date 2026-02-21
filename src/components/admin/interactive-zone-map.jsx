'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { useRef } from 'react';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';

// Fix for default icon not showing up in Next.js
if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function InteractiveZoneMap({
  coordinates,
  onCoordinatesChange,
}) {
  const defaultPosition = [12.84, 80.04]; // Default center
  const markersRef = useRef([]);

  const handleMapClick = (coord) => {
    if (coordinates.length < 4) {
      onCoordinatesChange([...coordinates, coord]);
    }
  };

  const handleMarkerDrag = (index, newCoord) => {
    const newCoords = [...coordinates];
    newCoords[index] = newCoord;
    onCoordinatesChange(newCoords);
  };

  const clearCoordinates = () => {
    onCoordinatesChange([]);
  };

  return (
    <div className="space-y-2">
       <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Define Zone on Map</p>
            <Button type="button" variant="outline" size="sm" onClick={clearCoordinates} disabled={coordinates.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Points
            </Button>
       </div>
        <MapContainer
          className="h-[400px] w-full rounded-md border"
          center={defaultPosition}
          zoom={13}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMapClick={handleMapClick} />
          {coordinates.map((pos, index) => (
            <Marker
              key={index}
              position={pos}
              draggable={true}
              ref={(el) => (markersRef.current[index] = el)}
              eventHandlers={{
                dragend: () => {
                  const marker = markersRef.current[index];
                  if (marker) {
                    const { lat, lng } = marker.getLatLng();
                    handleMarkerDrag(index, { lat, lng });
                  }
                },
              }}
            />
          ))}
          {coordinates.length > 2 && <Polygon positions={coordinates} />}
        </MapContainer>
      <p className="text-xs text-muted-foreground">Click on the map to add up to 4 corner points. Drag points to adjust.</p>
    </div>
  );
}
