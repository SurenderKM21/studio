import { UserDashboard } from '@/components/user/user-dashboard';
import { db } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function UserPage() {
  const zones = db.getZones();
  
  return (
     <div className="container mx-auto py-8">
       <UserDashboard initialZones={zones} />
    </div>
  );
}
