import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { Zone, AppSettings, User } from '@/lib/types';
import { ZoneManager } from './zone-manager';
import { DensityControl } from './density-control';
import { SettingsPanel } from './settings-panel';
import { Users, Map, Settings, List } from 'lucide-react';
import { UserMonitor } from './user-monitor';
import { ZoneDetails } from './zone-details';

interface AdminDashboardProps {
  initialZones: Zone[];
  initialSettings: AppSettings;
  initialUsers: User[];
}

export function AdminDashboard({
  initialZones,
  initialSettings,
  initialUsers,
}: AdminDashboardProps) {
  return (
    <Tabs defaultValue="zones" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="zones">
          <Map className="mr-2 h-4 w-4" />
          Zone Manager
        </TabsTrigger>
        <TabsTrigger value="zone-details">
          <List className="mr-2 h-4 w-4" />
          Zone Details
        </TabsTrigger>
        <TabsTrigger value="density">
          <Users className="mr-2 h-4 w-4" />
          Density Control
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="mr-2 h-4 w-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="zones">
        <ZoneManager initialZones={initialZones} />
      </TabsContent>
      <TabsContent value="zone-details">
        <ZoneDetails initialZones={initialZones} />
      </TabsContent>
      <TabsContent value="density">
        <DensityControl initialZones={initialZones} />
      </TabsContent>
      <TabsContent value="users">
        <UserMonitor initialUsers={initialUsers} />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsPanel initialSettings={initialSettings} />
      </TabsContent>
    </Tabs>
  );
}
