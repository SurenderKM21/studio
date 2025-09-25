export type DensityCategory = 'free' | 'moderate' | 'crowded' | 'over-crowded';

export type Coordinate = { lat: number; lng: number };

export type Zone = {
  id: string;
  name: string;
  coordinates: Coordinate[];
  capacity: number;
  userCount: number;
  density: DensityCategory;
};

export type RouteDetails = {
  route: string[];
  congestionLevel: string;
  alternativeRouteAvailable: boolean;
  alternativeRoute?: string[];
};

export type AppSettings = {
  locationUpdateInterval?: number; // in seconds
  zoneSnappingThreshold?: number; // in meters
};

export type User = {
  id: string;
  name: string;
  groupSize: number;
  lastLatitude?: number;
  lastLongitude?: number;
  lastSeen?: string;
};
