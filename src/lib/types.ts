export type DensityCategory = 'free' | 'moderate' | 'crowded' | 'over-crowded';

export type Zone = {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number }[];
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
  updateInterval: number;
};

export type User = {
  id: string;
  name: string;
  lastLatitude?: number;
  lastLongitude?: number;
  lastSeen?: string;
};
