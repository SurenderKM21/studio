
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteDetails, Zone, DensityCategory } from '@/lib/types';
import {
  Map,
  Users,
  Route as RouteIcon,
  ChevronsRight,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface RouteInfoProps {
  routeDetails: RouteDetails | null;
  isPlanning: boolean;
  zones: Zone[];
}

const congestionColors: Record<string, string> = {
  low: 'bg-green-500',
  moderate: 'bg-yellow-500',
  high: 'bg-orange-500',
  default: 'bg-gray-500',
};

const getZoneName = (zoneId: string, zones: Zone[]) => {
  return zones.find(z => z.id === zoneId)?.name ?? 'Unknown Zone';
};

export function RouteInfo({ routeDetails, isPlanning, zones }: RouteInfoProps) {
  if (isPlanning) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!routeDetails) {
    return (
      <Card className="shadow-lg text-center">
        <CardHeader>
          <div className="flex justify-center">
            <Map className="w-12 h-12 text-muted-foreground" />
          </div>
          <CardTitle>No Route Planned</CardTitle>
          <CardDescription>
            Select a start and end point to find the best path.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const RoutePath = ({ path }: { path: string[] }) => (
    <div className="flex items-center flex-wrap gap-2 text-sm">
      {path.map((zoneId, index) => (
        <div key={zoneId} className="flex items-center gap-2">
          <Badge variant="secondary">{getZoneName(zoneId, zones)}</Badge>
          {index < path.length - 1 && (
            <ChevronsRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Card className="shadow-lg animate-in fade-in-50">
      <CardHeader>
        <CardTitle>Route Details</CardTitle>
        <CardDescription>
          Here is the suggested path based on current crowd levels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Users className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Congestion Level</p>
            <Badge
              className={cn(
                'text-white mt-1',
                congestionColors[routeDetails.congestionLevel] ??
                  congestionColors.default
              )}
            >
              {routeDetails.congestionLevel}
            </Badge>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <RouteIcon className="h-5 w-5 text-primary mt-1" />
          <div>
            <p className="text-sm font-medium mb-2">Optimal Route</p>
            <RoutePath path={routeDetails.route} />
          </div>
        </div>

        {routeDetails.alternativeRouteAvailable && routeDetails.alternativeRoute && (
          <div className="flex items-start gap-4 border-t pt-4 border-dashed">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-1" />
            <div>
              <p className="text-sm font-medium mb-2">Congested Route (Avoided)</p>
              <p className="text-xs text-muted-foreground mb-2">The following path was avoided due to high congestion.</p>
              <RoutePath path={routeDetails.alternativeRoute} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
