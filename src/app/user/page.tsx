

import { UserDashboard } from '@/components/user/user-dashboard';
import { db } from '@/lib/data';
import { User } from '@/lib/types';

export const dynamic = 'force-dynamic';

const MOCK_USER: User = { id: 'user-1', name: 'John Doe', groupSize: 1 };

export default function UserPage() {
  const zones = db.getZones();
  const settings = db.getSettings();
  
  return (
     <div className="container mx-auto py-8">
       <UserDashboard initialZones={zones} initialUser={MOCK_USER} settings={settings} />
    </div>
  );
}
