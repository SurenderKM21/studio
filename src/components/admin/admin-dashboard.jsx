'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Users, Settings, Siren, RefreshCw, MessageSquareWarning, NotebookPen } from 'lucide-react';
import { ZoneManager } from './zone-manager';
import { DensityControl } from './density-control';
import { SettingsPanel } from './settings-panel';
import { SOSMonitor } from './sos-monitor';
import { UserMonitor } from './user-monitor';
import { ZoneDetails } from './zone-details';
import { OvercrowdedZones } from './overcrowded-zones';
import { AlertManager } from './alert-manager';
import { ZoneNotesManager } from './zone-notes-manager';
import { Button } from '../ui/button';
import { refreshDataAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function AdminDashboard({ initialZones = [], initialSettings = {}, initialUsers = [] }) {
  const [zones, setZones] = useState(initialZones);
  const [users, setUsers] = useState(initialUsers);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isRefreshing, startRefresh] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    // Set initial sync time on mount to avoid hydration mismatch
    setLastSyncTime(new Date().toLocaleTimeString());
    setZones(initialZones);
    setUsers(initialUsers);
  }, [initialZones, initialUsers]);

  const handleRefresh = () => {
    startRefresh(async () => {
      await refreshDataAction();
      setLastSyncTime(new Date().toLocaleTimeString());
      toast({
        title: 'Data Refreshed',
        description: 'The dashboard has been updated with the latest local data.',
      });
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
       startRefresh(async () => {
        await refreshDataAction();
        setLastSyncTime(new Date().toLocaleTimeString());
      });
    }, 15000); 

    return () => clearInterval(interval);
  }, []);

  const sosCount = (users || []).filter(u => u.sos && u.status === 'online').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Local Monitoring (db.json). {lastSyncTime ? `Last sync: ${lastSyncTime}` : 'Connecting...'}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="sos" className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-muted p-1">
          <TabsTrigger value="sos" className={sosCount > 0 ? 'text-destructive font-bold animate-pulse' : ''}>
            <Siren className="mr-2 h-4 w-4" />
            SOS ({sosCount})
          </TabsTrigger>
          <TabsTrigger value="zones">
            <Map className="mr-2 h-4 w-4" />
            Zones
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <MessageSquareWarning className="mr-2 h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="notes">
            <NotebookPen className="mr-2 h-4 w-4" />
            Notes
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
            <OvercrowdedZones zones={zones} />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserMonitor initialUsers={users} initialZones={zones} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsPanel initialSettings={initialSettings} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertManager zones={zones} />
        </TabsContent>

        <TabsContent value="notes">
          <ZoneNotesManager initialZones={zones} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
