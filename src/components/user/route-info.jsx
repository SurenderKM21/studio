'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Map,
  Users,
  Route as RouteIcon,
  ChevronsRight,
  AlertTriangle,
  Volume2,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';

const congestionColors = {
  low: 'bg-green-500',
  moderate: 'bg-yellow-500',
  high: 'bg-orange-500',
  default: 'bg-gray-500',
};

const getZoneName = (zoneId, zones) => {
  return zones.find((z) => z.id === zoneId)?.name ?? 'Unknown Zone';
};

export function RouteInfo({ routeDetails, isPlanning, zones, routingError }) {
  const [englishVoice, setEnglishVoice] = useState(null);
  const routeDetailsRef = useRef(null);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        // Find a standard English voice
        const voice = availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0];
        setEnglishVoice(voice);
      }
    };
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleSpeakRoute = useCallback(() => {
    if (
      !routeDetails?.route ||
      routeDetails.route.length === 0 ||
      typeof window === 'undefined' ||
      !window.speechSynthesis
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const translatedZoneNames = routeDetails.route.map((id) => getZoneName(id, zones));
    const routePrefix = 'The suggested route is:';
    const separator = ', then to ';

    let textToSpeak = `${routePrefix} ${translatedZoneNames.join(separator)}.`;

    if (routeDetails.alternativeRouteAvailable) {
      textToSpeak += ' A more direct but congested path was avoided.';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (englishVoice) {
      utterance.voice = englishVoice;
      utterance.lang = englishVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [routeDetails, zones, englishVoice]);

  useEffect(() => {
    if (routeDetails && routeDetails !== routeDetailsRef.current && englishVoice) {
      handleSpeakRoute();
      routeDetailsRef.current = routeDetails;
    }
    if (!routeDetails) {
      routeDetailsRef.current = null;
    }
  }, [routeDetails, englishVoice, handleSpeakRoute]);

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

  if (!routeDetails && !routingError) {
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
  
  if (routingError && !isPlanning) {
      return (
         <Card className="shadow-lg text-center">
            <CardHeader>
              <div className="flex justify-center">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              <CardTitle className="text-destructive">No route</CardTitle>
              <CardDescription>
                {routingError}
              </CardDescription>
            </CardHeader>
        </Card>
      );
  }

  if (!routeDetails) return null;

  const RoutePath = ({ path }) => (
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Route Details</CardTitle>
            <CardDescription>
              Here is the suggested path based on current crowd levels.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSpeakRoute}
            aria-label="Speak route details"
            disabled={!englishVoice}
          >
            <Volume2 className="h-5 w-5" />
          </Button>
        </div>
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

        {routeDetails.alternativeRouteAvailable &&
          routeDetails.alternativeRoute &&
          routeDetails.alternativeRoute.length > 0 && (
            <div className="flex items-start gap-4 border-t pt-4 border-dashed">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-1" />
              <div>
                <p className="text-sm font-medium mb-2">
                  Congested Route (Avoided)
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  The most direct path was avoided due to high congestion.
                </p>
                <RoutePath path={routeDetails.alternativeRoute} />
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
