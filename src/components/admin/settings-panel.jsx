'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { migrateDataToFirestore } from '@/lib/actions';
import { Database, Loader, CheckCircle2 } from 'lucide-react';

export function SettingsPanel() {
  const [isPending, startTransition] = useTransition();
  const [isMigrated, setIsMigrated] = useState(false);
  const { toast } = useToast();

  const handleMigration = () => {
    startTransition(async () => {
      const result = await migrateDataToFirestore();
      if (result.success) {
        setIsMigrated(true);
        toast({
          title: 'Migration Successful!',
          description: 'Your local data has been moved to Firestore.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Migration Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <CardTitle>Data Migration</CardTitle>
          </div>
          <CardDescription>
            One-time transfer of your existing local data (db.json) to the cloud (Firebase Firestore).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMigrated ? (
            <div className="flex flex-col items-center justify-center p-8 bg-primary/5 rounded-lg border border-dashed border-primary">
              <CheckCircle2 className="h-12 w-12 text-primary mb-2" />
              <p className="text-lg font-semibold">Data Successfully Migrated</p>
              <p className="text-sm text-muted-foreground">The application is now fully cloud-powered.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This action will populate your Firestore collections with the zones and users currently in your local file. 
                Use this to initialize your cloud database.
              </p>
              <Button onClick={handleMigration} disabled={isPending} size="lg" className="w-full sm:w-auto">
                {isPending ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  'Migrate from db.json to Firestore'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>Adjust global behavioral settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Global preferences are now managed via Firestore.</p>
        </CardContent>
      </Card>
    </div>
  );
}
