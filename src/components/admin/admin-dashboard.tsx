
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Users, Settings, Siren, MessageSquareWarning, NotebookPen, AlertTriangle } from 'lucide-react';
import { ZoneManager } from './zone-manager';
import { DensityControl } from './density-control';
import { SettingsPanel } from './settings-panel';
import { SOSMonitor } from './sos-monitor';
import { UserMonitor } from './user-monitor';
import { ZoneDetails } from './zone-details';
import { OvercrowdedZones } from './overcrowded-zones';
import { AlertManager } from './alert-manager';
import { ZoneNotesManager } from './zone-notes-manager';
import { 
  useCollection, 
  useMemoFirebase, 
  useFirestore 
} from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Zone, User, AppSettings } from '@/lib/types';

export function AdminDashboard({ initialSettings }: { initialSettings: AppSettings }) {
  const db = useFirestore();

  const zonesQuery = useMemoFirebase(() => collection(db, 'zones'), [db]);
  const { data: zones = [] } = useCollection<Zone>(zonesQuery);

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: users = [] } = useCollection<User>(usersQuery);

  const sosCount = users.filter(u => u.sos).length;
  const overCrowdedCount = zones.filter(z => z.density === 'over-crowded').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold">Admin Central</h1>
          <p className="text-muted-foreground text-sm">Real-time Firestore Management</p>
        </div>
      </div>

      <Tabs defaultValue="sos" className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-muted p-1">
          <TabsTrigger value="sos" className={sosCount > 0 ? 'text-destructive font-bold' : ''}>
            <Siren className="mr-2 h-4 w-4" /> SOS ({sosCount})
          </TabsTrigger>
          <TabsTrigger value="zones">
            <Map className="mr-2 h-4 w-4" /> Zones
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
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sos">
          <SOSMonitor initialUsers={users} initialZones={zones} />
        </TabsContent>
        <TabsContent value="zones">
          <div className="grid gap-6">
            <ZoneManager initialZones={zones} />
            <ZoneDetails initialZones={zones} />
            <DensityControl initialZones={zones} />
          </div>
        </TabsContent>
        <TabsContent value="users">
          <UserMonitor initialUsers={users} initialZones={zones} />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertManager zones={zones} />
        </TabsContent>
        <TabsContent value="overcrowded">
          <OvercrowdedZones zones={zones} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPanel initialSettings={initialSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
