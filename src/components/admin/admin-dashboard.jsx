
'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Users, Siren, MessageSquareWarning, AlertTriangle, Activity } from 'lucide-react';
import { ZoneManager } from './zone-manager';
import { DensityControl } from './density-control';
import { SOSMonitor } from './sos-monitor';
import { UserMonitor } from './user-monitor';
import { ZoneDetails } from './zone-details';
import { OvercrowdedZones } from './overcrowded-zones';
import { AlertManager } from './alert-manager';
import { 
  useCollection, 
  useMemoFirebase, 
  useFirestore 
} from '@/firebase';
import { collection } from 'firebase/firestore';

function calculateDensity(count, capacity) {
  const ratio = count / capacity;
  if (ratio >= 1) return 'over-crowded';
  if (ratio >= 0.7) return 'crowded';
  if (ratio >= 0.3) return 'moderate';
  return 'free';
}

export function AdminDashboard({ userId }) {
  const db = useFirestore();

  const zonesQuery = useMemoFirebase(() => collection(db, 'zones'), [db]);
  const { data: zonesData } = useCollection(zonesQuery);
  const zones = zonesData || [];

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: usersData } = useCollection(usersQuery);
  const users = usersData || [];

  const enrichedZones = useMemo(() => {
    return zones.map(zone => {
      const count = users.filter(u => u.lastZoneId === zone.id && u.status === 'online').length;
      const density = zone.manualDensity ? zone.density : calculateDensity(count, zone.capacity);
      return { ...zone, userCount: count, density };
    });
  }, [zones, users]);

  const sosCount = users.filter(u => u.sos).length;
  const overCrowdedCount = enrichedZones.filter(z => z.density === 'over-crowded').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold">Admin Central</h1>
          <p className="text-muted-foreground text-sm">Real-time Crowd Management</p>
        </div>
      </div>

      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-muted p-1">
          <TabsTrigger value="sos" className={sosCount > 0 ? 'text-destructive font-bold' : ''}>
            <Siren className="mr-2 h-4 w-4" /> SOS ({sosCount})
          </TabsTrigger>
          <TabsTrigger value="zones">
            <Map className="mr-2 h-4 w-4" /> Zones
          </TabsTrigger>
          <TabsTrigger value="density">
            <Activity className="mr-2 h-4 w-4" /> Density
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <MessageSquareWarning className="mr-2 h-4 w-4" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="overcrowded">
            <AlertTriangle className="mr-2 h-4 w-4" /> Overcrowded ({overCrowdedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sos">
          <SOSMonitor initialUsers={users} initialZones={enrichedZones} />
        </TabsContent>
        <TabsContent value="zones">
          <div className="grid gap-6">
            <ZoneManager initialZones={enrichedZones} />
            <ZoneDetails initialZones={enrichedZones} />
          </div>
        </TabsContent>
        <TabsContent value="density">
          <DensityControl initialZones={enrichedZones} />
        </TabsContent>
        <TabsContent value="users">
          <UserMonitor initialUsers={users} initialZones={enrichedZones} />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertManager zones={enrichedZones} />
        </TabsContent>
        <TabsContent value="overcrowded">
          <OvercrowdedZones zones={enrichedZones} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
