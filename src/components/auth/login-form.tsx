
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
import { loginUserAction } from '@/lib/actions';
import { SESSION_LOGIN_TIMESTAMP_KEY } from '../user/user-dashboard';

export function LoginForm() {
  const [role, setRole] = useState('user');
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    
    startTransition(async () => {
       const result = await loginUserAction({
          email,
          username,
          role,
          groupSize: 1 // Default group size for login
       });

       if (result.success) {
          toast({
            title: 'Login Successful',
            description: 'Redirecting to your dashboard...',
          });
          if (result.loginTimestamp && typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_LOGIN_TIMESTAMP_KEY, result.loginTimestamp);
          }
          if (result.role === 'user') {
            router.push(`/user?userId=${result.userId}`);
          } else {
            router.push(`/admin?userId=${result.userId}`);
          }
       } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: result.error || 'An unexpected error occurred.',
            });
       }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={setRole} defaultValue={role} disabled={isPending} name="role">
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === 'admin' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </>
          ) : (
             <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" placeholder="e.g. John Doe" required />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="underline text-primary">
              Register here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
