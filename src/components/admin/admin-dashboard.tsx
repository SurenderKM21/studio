
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Users, Settings, Siren, MessageSquareWarning, AlertTriangle, Database, NotebookPen, Activity } from 'lucide-react';
import { ZoneManager } from './zone-manager';
import { DensityControl } from './density-control';
import { SettingsPanel } from './settings-panel';
import { SOSMonitor } from './sos-monitor';
import { UserMonitor } from './user-monitor';
import { ZoneDetails } from './zone-details';
import { OvercrowdedZones } from './overcrowded-zones';
import { AlertManager } from './alert-manager';
import { MigrationTool } from './migration-tool';
import { ZoneNotesManager } from './zone-notes-manager';
import { 
  useCollection, 
  useMemoFirebase, 
  useFirestore 
} from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Zone, User } from '@/lib/types';

interface AdminDashboardProps {
  userId: string;
}

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const db = useFirestore();

  const zonesQuery = useMemoFirebase(() => collection(db, 'zones'), [db]);
  const { data: zonesData } = useCollection(zonesQuery);
  const zones = (zonesData as Zone[]) || [];

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: usersData } = useCollection(usersQuery);
  const users = (usersData as User[]) || [];

  const sosCount = users.filter(u => u.sos).length;
  const overCrowdedCount = zones.filter(z => z.density === 'over-crowded').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold">Admin Central</h1>
          <p className="text-muted-foreground text-sm">Real-time Cloud Management</p>
        </div>
      </div>

      <Tabs defaultValue="sos" className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-muted p-1">
          <TabsTrigger value="sos" className={sosCount > 0 ? 'text-destructive font-bold animate-pulse' : ''}>
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
          <TabsTrigger value="notes">
            <NotebookPen className="mr-2 h-4 w-4" /> Notes
          </TabsTrigger>
          <TabsTrigger value="overcrowded">
            <AlertTriangle className="mr-2 h-4 w-4" /> Overcrowded ({overCrowdedCount})
          </TabsTrigger>
          <TabsTrigger value="migration">
            <Database className="mr-2 h-4 w-4" /> Migration
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
          </div>
        </TabsContent>
        <TabsContent value="density">
          <DensityControl initialZones={zones} />
        </TabsContent>
        <TabsContent value="users">
          <UserMonitor initialUsers={users} initialZones={zones} />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertManager zones={zones} />
        </TabsContent>
        <TabsContent value="notes">
          <ZoneNotesManager initialZones={zones} />
        </TabsContent>
        <TabsContent value="overcrowded">
          <OvercrowdedZones zones={zones} />
        </TabsContent>
        <TabsContent value="migration">
          <MigrationTool />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPanel initialSettings={{}} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
