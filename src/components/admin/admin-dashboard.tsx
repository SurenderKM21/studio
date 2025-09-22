import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { Zone, AppSettings } from '@/lib/types';
import { ZoneManager } from './zone-manager';
import { DensityControl } from './density-control';
import { SettingsPanel } from './settings-panel';
import { Users, Map, Settings } from 'lucide-react';

interface AdminDashboardProps {
  initialZones: Zone[];
  initialSettings: AppSettings;
}

export function AdminDashboard({
  initialZones,
  initialSettings,
}: AdminDashboardProps) {
  return (
    <Tabs defaultValue="zones" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="zones">
          <Map className="mr-2 h-4 w-4" />
          Zone Manager
        </TabsTrigger>
        <TabsTrigger value="density">
          <Users className="mr-2 h-4 w-4" />
          Density Control
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="zones">
        <ZoneManager initialZones={initialZones} />
      </TabsContent>
      <TabsContent value="density">
        <DensityControl initialZones={initialZones} />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsPanel initialSettings={initialSettings} />
      </TabsContent>
    </Tabs>
  );
}
