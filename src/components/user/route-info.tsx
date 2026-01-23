'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteDetails, Zone } from '@/lib/types';
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
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';

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
  return zones.find((z) => z.id === zoneId)?.name ?? 'Unknown Zone';
};

export function RouteInfo({ routeDetails, isPlanning, zones }: RouteInfoProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Find and set a default English voice if available
        if (!selectedVoiceURI) {
          const defaultVoice =
            availableVoices.find((v) => v.lang.startsWith('en')) ||
            availableVoices[0];
          if (defaultVoice) {
            setSelectedVoiceURI(defaultVoice.voiceURI);
          }
        }
      }
    };

    // The 'voiceschanged' event is crucial because getVoices() can be async.
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial call

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleSpeakRoute = () => {
    if (
      !routeDetails?.route ||
      !routeDetails.route.length ||
      typeof window === 'undefined' ||
      !window.speechSynthesis
    ) {
      return;
    }

    // Stop any currently speaking utterances
    window.speechSynthesis.cancel();

    const zoneNames = routeDetails.route.map((id) => getZoneName(id, zones));

    let textToSpeak = `The suggested route is: ${zoneNames.join(
      ', then to '
    )}.`;

    if (routeDetails.alternativeRouteAvailable) {
      textToSpeak += ' A more direct but congested path was avoided.';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const selectedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'en-US'; // Fallback
    }

    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

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
            disabled={voices.length === 0}
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
        
        {voices.length > 0 && (
            <div className="space-y-2 border-t pt-4">
                <Label htmlFor="voice-select">Narration Language</Label>
                <Select onValueChange={setSelectedVoiceURI} value={selectedVoiceURI}>
                    <SelectTrigger id="voice-select">
                        <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                        {voices.map((voice) => (
                            <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                {`${voice.name} (${voice.lang})`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
