'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function RoleSelector() {
  return (
    <div className="grid md:grid-cols-2 gap-8 w-full max-w-sm">
      <Button size="lg" className="w-full font-bold" asChild>
        <Link href="/login">Login</Link>
      </Button>
      <Button size="lg" variant="secondary" className="w-full font-bold" asChild>
        <Link href="/register">Register</Link>
      </Button>
    </div>
  );
}
