export type DensityCategory = 'free' | 'moderate' | 'crowded' | 'over-crowded';

export type Coordinate = { lat: number; lng: number };

export type Zone = {
  id: string;
  name: string;
  coordinates: Coordinate[];
  capacity: number;
  userCount: number;
  density: DensityCategory;
  manualDensity?: boolean;
  manualDensityAtCount?: number;
};

export type RouteDetails = {
  route: string[];
  congestionLevel: string;
  alternativeRouteAvailable: boolean;
  alternativeRoute?: string[];
};

export type User = {
  id: string;
  name: string;
  groupSize: number;
  lastLatitude?: number;
  lastLongitude?: number;
  lastSeen?: string;
  lastZoneId?: string;
  status?: 'online' | 'offline';
  role?: 'user' | 'admin';
  sos?: boolean;
};

export type AlertMessage = {
  id: string;
  message: string;
  timestamp: string;
  zoneId?: string; // If undefined, it's a global alert
};
