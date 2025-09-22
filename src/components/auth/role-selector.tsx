'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function RoleSelector() {
  const router = useRouter();

  return (
    <div className="grid md:grid-cols-2 gap-8 w-full max-w-sm">
      <Button
        size="lg"
        className="w-full font-bold"
        onClick={() => router.push('/login')}
      >
        Login
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="w-full font-bold"
        onClick={() => router.push('/register')}
      >
        Register
      </Button>
    </div>
  );
}
