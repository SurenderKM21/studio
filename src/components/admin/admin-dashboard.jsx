'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Map, Users, Settings, AlertTriangle, Siren, RefreshCw, MessageSquareWarning, NotebookPen, List } from 'lucide-react';
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

export function AdminDashboard() {
  const db = useFirestore();
  const { data: zones = [], loading: zonesLoading } = useCollection(db ? collection(db, 'zones') : null);
  const { data: users = [], loading: usersLoading } = useCollection(db ? collection(db, 'users') : null);

  const sosCount = (users || []).filter(u => u.sos && u.status === 'online').length;
  const overCrowdedCount = (zones || []).filter(z => z.density === 'over-crowded').length;

  if (zonesLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Loading cloud data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Real-time Cloud Monitoring</p>
        </div>
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

        <TabsContent value="users">
          <UserMonitor initialUsers={users} initialZones={zones} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsPanel initialSettings={{}} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
