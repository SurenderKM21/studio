import { UserDashboard } from '@/components/user/user-dashboard';
import { db } from '@/lib/data';

export const dynamic = 'force-dynamic'

export default async function UserPage() {
  const zones = db.getZones();
  const settings = db.getSettings();
  
  return (
     <div className="container mx-auto py-8">
       <UserDashboard initialZones={zones} settings={settings} />
    </div>
  );
}
