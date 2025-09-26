
import Link from 'next/link';
import { EvacAIIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { LogoutButton } from '../auth/logout-button';

type HeaderProps = {
  section: 'User' | 'Admin';
  userId?: string;
};

export function Header({ section, userId }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <EvacAIIcon className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">EvacAI</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
           <Badge variant={section === 'Admin' ? 'destructive' : 'default'}>{section} View</Badge>
           {userId && <LogoutButton userId={userId} />}
        </div>
      </div>
    </header>
  );
}

    