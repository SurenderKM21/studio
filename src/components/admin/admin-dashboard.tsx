
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
import { Users, Map, Settings, List, AlertTriangle, RefreshCw } from 'lucide-react';
import { UserMonitor } from './user-monitor';
import { ZoneDetails } from './zone-details';
import { OvercrowdedZones } from './overcrowded-zones';
import { useEffect, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { refreshDataAction } from '@/lib/actions';

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
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const { toast } = useToast();
  const [isRefreshing, startRefresh] = useTransition();

  // This effect ensures that when the server sends updated props, the local state is updated.
  useEffect(() => {
    const previousZones = zones;
    setZones(initialZones);
    setUsers(initialUsers);
    setLastSyncTime(new Date().toLocaleTimeString());

    // Compare initialZones with the previous state to find new overcrowded zones
    initialZones.forEach((newZone) => {
      const prevZone = previousZones.find((z) => z.id === newZone.id);
      if (
        prevZone &&
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
  }, [initialZones, initialUsers]);


  const handleRefresh = () => {
    startRefresh(async () => {
      await refreshDataAction();
      toast({
        title: 'Data Refreshed',
        description: 'The dashboard has been updated with the latest data.',
      });
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
       startRefresh(async () => {
        await refreshDataAction();
      });
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const overCrowdedCount = zones.filter(
    (z) => z.density === 'over-crowded'
  ).length;

  return (
    <div>
       <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <div>
           <h1 className="text-4xl font-headline font-bold mb-2">Admin Dashboard</h1>
           <p className="text-muted-foreground">
             Manage zones and system settings. Last sync: {lastSyncTime}
           </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
        </Button>
      </div>
      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto">
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
          <UserMonitor initialUsers={users} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPanel initialSettings={initialSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
