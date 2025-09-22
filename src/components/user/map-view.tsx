'use client';

import { cn } from '@/lib/utils';
import type { Zone, DensityCategory } from '@/lib/types';
import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const densityStyles: Record<
  DensityCategory,
  { background: string; border: string }
> = {
  free: { background: 'bg-green-500/20', border: 'border-green-500' },
  moderate: { background: 'bg-yellow-500/20', border: 'border-yellow-500' },
  crowded: { background: 'bg-orange-500/20', border: 'border-orange-500' },
  'over-crowded': { background: 'bg-red-500/20', border: 'border-red-500' },
};

interface MapViewProps {
  zones: Zone[];
  route: string[];
  alternativeRoute: string[];
}

const zonePositions = [
  { top: '10%', left: '40%' },
  { top: '35%', left: '15%' },
  { top: '40%', left: '70%' },
  { top: '75%', left: '55%' },
  { top: '5%', left: '5%' },
  { top: '60%', left: '30%' },
];

export function MapView({ zones, route, alternativeRoute }: MapViewProps) {
  const positionedZones = useMemo(() => {
    return zones.map((zone, index) => ({
      ...zone,
      position: zonePositions[index % zonePositions.length],
    }));
  }, [zones]);

  const routePoints = useMemo(() => {
    return route
      .map((zoneId) => {
        const zone = positionedZones.find((z) => z.id === zoneId);
        if (!zone) return null;
        // Calculate center of the div
        const top = parseFloat(zone.position.top);
        const left = parseFloat(zone.position.left);
        return { x: left + 7.5, y: top + 4 }; // 7.5 = 15/2, 4 = 8/2 rem
      })
      .filter(Boolean);
  }, [route, positionedZones]);

  const altRoutePoints = useMemo(() => {
    return alternativeRoute
      .map((zoneId) => {
        const zone = positionedZones.find((z) => z.id === zoneId);
        if (!zone) return null;
        const top = parseFloat(zone.position.top);
        const left = parseFloat(zone.position.left);
        return { x: left + 7.5, y: top + 4 };
      })
      .filter(Boolean);
  }, [alternativeRoute, positionedZones]);


  return (
    <TooltipProvider>
      <div className="relative w-full h-[550px] bg-muted/30 rounded-lg border-dashed border-2 overflow-hidden">
        {/* Draw route lines */}
        <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {altRoutePoints.length > 1 && (
                <polyline
                    points={altRoutePoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeOpacity="0.5"
                    strokeWidth="5"
                    strokeDasharray="8 8"
                    strokeLinecap='round'
                />
            )}
            {routePoints.length > 1 && (
                <polyline
                    points={routePoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="7"
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
            )}
        </svg>

        {/* Render zones */}
        {positionedZones.map((zone) => (
          <Tooltip key={zone.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'absolute w-3/12 h-1/6 rounded-lg border-2 flex items-center justify-center p-2 text-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
                  densityStyles[zone.density].background,
                  densityStyles[zone.density].border,
                   (route.includes(zone.id) || alternativeRoute.includes(zone.id)) ? 'shadow-2xl scale-110' : 'shadow-md'
                )}
                style={zone.position}
              >
                <span className="font-bold text-sm">{zone.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Density: {zone.density}</p>
              <p>Users: {zone.userCount} / {zone.capacity}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
