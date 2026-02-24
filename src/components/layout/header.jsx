'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LogoutButton } from '../auth/logout-button';
import { ThemeToggle } from './theme-toggle';

export function Header({ section }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">EvacAI</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
           <Badge variant={section === 'Admin' ? 'destructive' : 'default'}>{section} View</Badge>
           <LogoutButton />
           <ThemeToggle />
        </div>
      </div>
    </header>
  );
}