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
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { loginUserAction } from '@/lib/actions';
import { SESSION_LOGIN_TIMESTAMP_KEY } from '../user/user-dashboard';
import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

export function LoginForm() {
  const [role, setRole] = useState('user');
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;
    
    startTransition(async () => {
       try {
         const { auth } = initializeFirebase();
         
         if (role === 'admin') {
           // Perform real Firebase Email/Password Auth for Admins
           await signInWithEmailAndPassword(auth, email, password);
         } else {
           // Perform Anonymous Auth for regular users
           await signInAnonymously(auth);
         }

         const result = await loginUserAction({
            email,
            username,
            role,
            groupSize: 1
         });

         if (result.success) {
            toast({
              title: 'Login Successful',
              description: role === 'admin' ? 'Admin session verified.' : 'Welcome to EvacAI!',
            });
            
            if (result.loginTimestamp && typeof window !== 'undefined') {
              sessionStorage.setItem(SESSION_LOGIN_TIMESTAMP_KEY, result.loginTimestamp);
            }

            const targetPath = result.role === 'user' ? '/user' : '/admin';
            router.push(`${targetPath}?userId=${result.userId}`);
         } else {
            toast({
                variant: 'destructive',
                title: 'Sync Failed',
                description: result.error || 'Could not synchronize session with the cloud.',
            });
         }
       } catch (error: any) {
         let errorMessage = 'An unexpected error occurred.';
         if (error.code === 'auth/invalid-credential') {
           errorMessage = 'Invalid admin credentials. Please check your email and password.';
         } else if (error.code === 'auth/user-not-found') {
           errorMessage = 'Admin account not found.';
         } else if (error.code === 'auth/wrong-password') {
           errorMessage = 'Incorrect password.';
         }

         toast({
           variant: 'destructive',
           title: 'Authentication Error',
           description: errorMessage,
         });
       }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Login</CardTitle>
          <CardDescription>
            {role === 'admin' 
              ? 'Admin access requires verified credentials.' 
              : 'Enter a username to start navigating.'}
          </CardDescription>
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
                <Label htmlFor="email">Admin Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="admin@evacai.com" 
                  required 
                  disabled={isPending} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  disabled={isPending} 
                />
              </div>
            </>
          ) : (
             <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                name="username" 
                type="text" 
                placeholder="e.g. kavin" 
                required 
                disabled={isPending} 
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {role === 'admin' ? 'Verify Admin' : 'Enter Dashboard'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
