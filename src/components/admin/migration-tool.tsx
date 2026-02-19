
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLocalDataAction } from '@/lib/actions';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader, Database, CheckCircle, AlertCircle } from 'lucide-react';

export function MigrationTool() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const db = useFirestore();
  const { toast } = useToast();

  const handleMigration = async () => {
    setIsMigrating(true);
    setStatus('loading');
    setProgress('Reading local db.json...');

    try {
      const localData = await getLocalDataAction();
      const { zones = [], users = [], alerts = [] } = localData;

      const totalItems = zones.length + users.length + alerts.length;
      if (totalItems === 0) {
        setStatus('success');
        setProgress('No data found in local database to migrate.');
        return;
      }

      let count = 0;

      // Migrate Zones
      for (const zone of zones) {
        setProgress(`Migrating zone: ${zone.name}...`);
        await setDoc(doc(db, 'zones', zone.id), zone);
        count++;
      }

      // Migrate Users
      for (const user of users) {
        setProgress(`Migrating user: ${user.name}...`);
        await setDoc(doc(db, 'users', user.id), user);
        count++;
      }

      // Migrate Alerts
      for (const alert of alerts) {
        setProgress(`Migrating alert: ${alert.id}...`);
        await setDoc(doc(db, 'alerts', alert.id), alert);
        count++;
      }

      setStatus('success');
      setProgress(`Successfully migrated ${count} items to Firestore!`);
      toast({
        title: 'Migration Complete',
        description: `${count} items have been moved to the cloud.`,
      });
    } catch (error: any) {
      console.error('Migration failed:', error);
      setStatus('error');
      setProgress(`Error: ${error.message || 'Unknown error occurred'}`);
      toast({
        variant: 'destructive',
        title: 'Migration Failed',
        description: 'Check console for details.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          <CardTitle>Cloud Migration Tool</CardTitle>
        </div>
        <CardDescription>
          Push your local data from <code>src/lib/db.json</code> to Firebase Firestore. 
          This will override existing documents in Firestore with the same IDs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-md min-h-[100px] flex flex-col justify-center items-center text-center">
          {status === 'idle' && (
            <p className="text-muted-foreground">Ready to start migration.</p>
          )}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-2">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="font-medium animate-pulse">{progress}</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-2 text-green-600">
              <CheckCircle className="h-8 w-8" />
              <p className="font-bold">{progress}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-2 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="font-bold">{progress}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleMigration} 
          disabled={isMigrating} 
          className="w-full"
        >
          {isMigrating ? 'Migrating...' : 'Push Local Data to Firestore'}
        </Button>
      </CardFooter>
    </Card>
  );
}
