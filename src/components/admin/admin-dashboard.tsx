
'use client';
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
import { Users, Map, Settings, List, AlertTriangle } from 'lucide-react';
import { UserMonitor } from './user-monitor';
import { ZoneDetails } from './zone-details';
import { OvercrowdedZones } from './overcrowded-zones';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const { toast } = useToast();

  useEffect(() => {
    // Compare initialZones with the previous state to find new overcrowded zones
    zones.forEach((prevZone) => {
      const newZone = initialZones.find((z) => z.id === prevZone.id);
      if (
        newZone &&
        newZone.density === 'over-crowded' &&
        prevZone.density !== 'over-crowded'
      ) {
        toast({
          variant: 'destructive',
          title: 'Zone Over-crowded!',
          description: `The "${newZone.name}" zone has reached maximum capacity.`,
          duration: 10000,
        });
      }
    });
    setZones(initialZones);
  }, [initialZones, toast, zones]);

  const overCrowdedCount = zones.filter(
    (z) => z.density === 'over-crowded'
  ).length;

  return (
    <Tabs defaultValue="zones" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
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
        <TabsTrigger value="overcrowded" className="text-destructive">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Over-crowded ({overCrowdedCount})
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
        <ZoneManager initialZones={zones} />
      </TabsContent>
      <TabsContent value="zone-details">
        <ZoneDetails initialZones={zones} />
      </TabsContent>
      <TabsContent value="density">
        <DensityControl initialZones={zones} />
      </TabsContent>
       <TabsContent value="overcrowded">
        <OvercrowdedZones zones={zones} />
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
