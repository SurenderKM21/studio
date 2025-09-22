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
import { User, Shield } from 'lucide-react';

export function RoleSelector() {
  const router = useRouter();

  return (
    <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
      <Card className="transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl">
        <CardHeader className="items-center text-center">
          <User className="w-12 h-12 mb-4 text-primary" />
          <CardTitle className="font-headline text-3xl">User</CardTitle>
          <CardDescription>
            Find the optimal path and navigate through the event with ease.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            size="lg"
            className="w-full font-bold"
            onClick={() => router.push('/user')}
          >
            Enter as User
          </Button>
        </CardContent>
      </Card>
      <Card className="transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl">
        <CardHeader className="items-center text-center">
          <Shield className="w-12 h-12 mb-4 text-primary" />
          <CardTitle className="font-headline text-3xl">Admin</CardTitle>
          <CardDescription>
            Manage zones, monitor crowd density, and configure system settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            size="lg"
            variant="secondary"
            className="w-full font-bold"
            onClick={() => router.push('/admin')}
          >
            Enter as Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
