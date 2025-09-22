import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { db } from '@/lib/data';

export default async function AdminPage() {
  const zones = db.getZones();
  const settings = db.getSettings();
  const users = db.getUsers();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-headline font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage zones and system settings.
      </p>
      <AdminDashboard initialZones={zones} initialSettings={settings} initialUsers={users} />
    </div>
  );
}
