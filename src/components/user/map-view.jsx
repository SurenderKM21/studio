'use client';

import { cn } from '@/lib/utils';
import { useMemo, useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const densityStyles = {
  free: { background: 'bg-green-500/20', border: 'border-green-500', dot: 'bg-green-500' },
  moderate: { background: 'bg-yellow-500/20', border: 'border-yellow-500', dot: 'bg-yellow-500' },
  crowded: { background: 'bg-orange-500/20', border: 'border-orange-500', dot: 'bg-orange-500' },
  'over-crowded': { background: 'bg-red-500/20', border: 'border-red-500', dot: 'bg-red-500' },
};

const highlightedDensityStyles = {
  free: { background: 'bg-green-700/40', border: 'border-green-700', dot: 'bg-green-700' },
  moderate: { background: 'bg-yellow-600/40', border: 'border-yellow-600', dot: 'bg-yellow-600' },
  crowded: { background: 'bg-orange-700/40', border: 'border-orange-700', dot: 'bg-orange-700' },
  'over-crowded': { background: 'bg-red-700/40', border: 'border-red-700', dot: 'bg-red-700' },
};

export function MapView({ zones, route, alternativeRoute }) {
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  
  const safeZones = zones || [];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (route && route.length > 0) {
      setIsAnimating(true);
      setIsHighlighting(true);
      
      const animationTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 15000);
      
      const highlightTimer = setTimeout(() => {
        setIsHighlighting(false);
      }, 15000);

      return () => {
        clearTimeout(animationTimer);
        clearTimeout(highlightTimer);
      };
    } else {
      setIsAnimating(false);
      setIsHighlighting(false);
    }
  }, [route]);

  const getRoutePoints = (path) => {
    if (!isClient || !path) return [];
    
    return path
      .map((zoneId) => {
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return null;

        const container = zoneEl.offsetParent;
        if (!container) return null;

        const x =
          ((zoneEl.offsetLeft + zoneEl.offsetWidth / 2) /
            container.offsetWidth) *
          100;
        const y =
          ((zoneEl.offsetTop + zoneEl.offsetHeight / 2) /
            container.offsetHeight) *
          100;

        return { x, y };
      })
      .filter((p) => p !== null);
  };
  
  const routePoints = useMemo(() => getRoutePoints(route), [route, safeZones, isClient]);
  const altRoutePoints = useMemo(() => getRoutePoints(alternativeRoute), [alternativeRoute, safeZones, isClient]);

  return (
    <TooltipProvider>
      <div className="relative w-full min-h-[550px] bg-muted/30 rounded-lg border-dashed border-2 p-4">
        <div className="relative grid grid-cols-3 grid-rows-3 gap-4 h-[520px]">
          {safeZones.map((zone) => {
            const isInRecommendedRoute = route?.includes(zone.id);
            const isInConsideredPath = isInRecommendedRoute || alternativeRoute?.includes(zone.id);

            const currentStyles = (isInRecommendedRoute && isHighlighting) 
                ? highlightedDensityStyles[zone.density] 
                : densityStyles[zone.density];

            return (
            <Tooltip key={zone.id}>
              <TooltipTrigger asChild>
                <div
                  id={zone.id}
                  className={cn(
                    'w-full h-full rounded-lg border-2 flex items-center justify-center p-2 text-center transition-all duration-500 ease-in-out relative',
                    currentStyles.background,
                    currentStyles.border,
                    isInConsideredPath
                      ? 'shadow-2xl scale-105'
                      : 'shadow-md'
                  )}
                >
                  <span className="font-bold text-sm z-10 bg-background/50 px-1 rounded">{zone.name}</span>
                  <div className="absolute inset-0 grid grid-cols-5 gap-1 p-2">
                    {Array.from({ length: Math.min(zone.userCount, 50) }).map((_, i) => (
                      <div key={i} className={cn("w-2 h-2 rounded-full", currentStyles.dot)} />
                    ))}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Density: {zone.density}</p>
                <p>
                  Users: {zone.userCount} / {zone.capacity}
                </p>
              </TooltipContent>
            </Tooltip>
          )})}
          {safeZones.length === 0 && (
            <div className="col-span-3 row-span-3 flex items-center justify-center text-muted-foreground italic">
              Loading map data...
            </div>
          )}
        </div>
        
        {isClient && (
            <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
            >
            {altRoutePoints.length > 1 && (
                <polyline
                points={altRoutePoints.map((p) => `${p.x}%,${p.y}%`).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeOpacity="0.5"
                strokeWidth="5"
                strokeDasharray="8 8"
                strokeLinecap="round"
                />
            )}
            {routePoints.length > 1 && (
                <polyline
                  points={routePoints.map((p) => `${p.x}%,${p.y}%`).join(' ')}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={isAnimating ? "20 10" : "none"}
                >
                  {isAnimating && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-30"
                      dur="0.5s"
                      repeatCount="indefinite"
                    />
                  )}
                </polyline>
            )}
            </svg>
        )}
      </div>
    </TooltipProvider>
  );
}
