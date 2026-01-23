'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function RoleSelector() {
  return (
    <div className="w-full max-w-sm">
      <Button size="lg" className="w-full font-bold" asChild>
        <Link href="/login">Login</Link>
      </Button>
    </div>
  );
}
