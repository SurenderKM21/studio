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

// Hardcoded translations for TTS
const translations = {
  // Phrases
  'The suggested route is:': {
    ta: 'பரிந்துரைக்கப்பட்ட பாதை:',
    hi: 'सुझाया गया मार्ग है:',
  },
  ', then to ': {
    ta: ', பிறகு ',
    hi: ', फिर ',
  },
  'A more direct but congested path was avoided.': {
    ta: 'அதிக நெரிசல் காரணமாக நேரடியான பாதை தவிர்க்கப்பட்டது.',
    hi: 'अधिक भीड़भाड़ वाला सीधा रास्ता टाला गया।',
  },
  // Zone Names from db.json
  Area1: { ta: 'பகுதி ஒன்று', hi: 'क्षेत्र एक' },
  KV_HOME: { ta: 'கேவி இல்லம்', hi: 'केवी होम' },
  'IT Park': { ta: 'ஐடி பார்க்', hi: 'आईटी पार्क' },
  Zone41: { ta: 'மண்டலம் நாற்பத்தி ஒன்று', hi: 'जोन इकतालीस' },
  Zone5: { ta: 'மண்டலம் ஐந்து', hi: 'जोन पांच' },
  Zone6: { ta: 'மண்டலம் ஆறு', hi: 'जोन छह' },
  'Side Path': { ta: 'பக்கவாட்டு பாதை', hi: 'साइड पथ' },
  'Mathura flats : Home': {
    ta: 'மதுரா குடியிருப்பு : இல்லம்',
    hi: 'मथुरा फ्लैट्स : होम',
  },
  Home: { ta: 'இல்லம்', hi: 'घर' },
};

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
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleSpeakRoute = () => {
    if (
      !routeDetails?.route ||
      routeDetails.route.length === 0 ||
      typeof window === 'undefined' ||
      !window.speechSynthesis
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const selectedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    const langCode = selectedVoice ? selectedVoice.lang.split('-')[0] : 'en';

    const translate = (text: string, lang: string): string => {
      const key = text as keyof typeof translations;
      if (
        translations[key] &&
        lang in translations[key] &&
        translations[key][lang as keyof typeof translations[typeof key]]
      ) {
        return translations[key][lang as keyof typeof translations[typeof key]];
      }
      return text;
    };

    const translatedZoneNames = routeDetails.route.map((id) => {
      const zoneName = getZoneName(id, zones);
      return translate(zoneName, langCode);
    });

    const routePrefix = translate('The suggested route is:', langCode);
    const separator = translate(', then to ', langCode);

    let textToSpeak = `${routePrefix} ${translatedZoneNames.join(separator)}.`;

    if (routeDetails.alternativeRouteAvailable) {
      textToSpeak += ` ${translate(
        'A more direct but congested path was avoided.',
        langCode
      )}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

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
