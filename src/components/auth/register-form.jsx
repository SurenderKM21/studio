'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

export function RegisterForm() {
  const [role, setRole] = useState('user');
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    startTransition(() => {
      toast({
        title: 'Registration Successful',
        description: 'Redirecting to login...',
      });
      router.push('/login');
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Register</CardTitle>
          <CardDescription>Create your account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" placeholder="John Doe" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={setRole} defaultValue={role} disabled={isPending}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
             {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
           <p className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Login here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}