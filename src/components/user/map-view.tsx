'use client';

import { cn } from '@/lib/utils';
import type { Zone, DensityCategory, ZoneNote } from '@/lib/types';
import { useMemo, useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { NotebookPen } from 'lucide-react';

const densityStyles: Record<
  DensityCategory,
  { background: string; border: string; dot: string }
> = {
  free: { background: 'bg-green-500/20', border: 'border-green-500', dot: 'bg-green-500' },
  moderate: { background: 'bg-yellow-500/20', border: 'border-yellow-500', dot: 'bg-yellow-500' },
  crowded: { background: 'bg-orange-500/20', border: 'border-orange-500', dot: 'bg-orange-500' },
  'over-crowded': { background: 'bg-red-500/20', border: 'border-red-500', dot: 'bg-red-500' },
};

// Darker styles for highlighting the route
const highlightedDensityStyles: Record<
  DensityCategory,
  { background: string; border: string; dot: string }
> = {
  free: { background: 'bg-green-700/40', border: 'border-green-700', dot: 'bg-green-700' },
  moderate: { background: 'bg-yellow-600/40', border: 'border-yellow-600', dot: 'bg-yellow-600' },
  crowded: { background: 'bg-orange-700/40', border: 'border-orange-700', dot: 'bg-orange-700' },
  'over-crowded': { background: 'bg-red-700/40', border: 'border-red-700', dot: 'bg-red-700' },
};

interface MapViewProps {
  zones: Zone[];
  route: string[];
  alternativeRoute: string[];
}

export function MapView({ zones, route, alternativeRoute }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // When a new route is provided, start the animation and highlighting.
    if (route.length > 0) {
      setIsAnimating(true);
      setIsHighlighting(true);
      
      const animationTimer = setTimeout(() => {
        setIsAnimating(false); // Stop path animation after 15 seconds
      }, 15000);
      
      const highlightTimer = setTimeout(() => {
        setIsHighlighting(false); // Stop color highlight after 15 seconds
      }, 15000);

      return () => {
        clearTimeout(animationTimer);
        clearTimeout(highlightTimer);
      };
    } else {
      // If the route is cleared, ensure animations are stopped.
      setIsAnimating(false);
      setIsHighlighting(false);
    }
  }, [route]);

  const getRoutePoints = (path: string[]) => {
    if (!isClient) return [];
    
    return path
      .map((zoneId) => {
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return null;

        const container = zoneEl.offsetParent as HTMLElement;
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
      .filter((p): p is { x: number; y: number } => p !== null);
  };
  
  const routePoints = useMemo(() => getRoutePoints(route), [route, zones, isClient]);
  const altRoutePoints = useMemo(() => getRoutePoints(alternativeRoute), [alternativeRoute, zones, isClient]);


  return (
    <TooltipProvider>
      <div className="relative w-full min-h-[550px] bg-muted/30 rounded-lg border-dashed border-2 p-4">
        <div className="relative grid grid-cols-3 grid-rows-3 gap-4 h-[520px]">
          {/* Render zones */}
          {zones.map((zone) => {
            const visibleNotes = zone.notes?.filter(n => n.visibleToUser) ?? [];
            const isInRecommendedRoute = route.includes(zone.id);
            const isInConsideredPath = isInRecommendedRoute || alternativeRoute.includes(zone.id);

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
                {visibleNotes.length > 0 && (
                    <>
                        <Separator className="my-2" />
                        <div className="space-y-1">
                            {visibleNotes.map(note => (
                                <div key={note.id} className="flex items-center gap-2">
                                    <NotebookPen className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-xs">{note.text}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
              </TooltipContent>
            </Tooltip>
          )})}
        </div>
        
        {/* Draw route lines */}
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
