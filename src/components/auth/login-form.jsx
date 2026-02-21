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
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export function LoginForm() {
  const [role, setRole] = useState('user');
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');
    const username = formData.get('username');
    
    startTransition(async () => {
       try {
         const { auth, firestore } = initializeFirebase();
         
         if (role === 'admin') {
           await signInWithEmailAndPassword(auth, email, password);
           
           const adminId = email.split('@')[0].toLowerCase();
           const adminRef = doc(firestore, 'users', adminId);
           await setDoc(adminRef, {
             id: adminId,
             name: 'Main Admin',
             email: email,
             role: 'admin',
             status: 'online',
             lastSeen: new Date().toISOString()
           }, { merge: true });

         } else {
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
            
            const targetPath = result.role === 'user' ? '/user' : '/admin';
            router.push(`${targetPath}?userId=${result.userId}`);
         } else {
            toast({
                variant: 'destructive',
                title: 'Sync Failed',
                description: result.error || 'Could not synchronize session.',
            });
         }
       } catch (error) {
         let errorMessage = 'An unexpected error occurred.';
         if (error.code === 'auth/invalid-credential') {
           errorMessage = 'Invalid credentials. Please check your email and password.';
         } else if (error.code === 'auth/user-not-found') {
           errorMessage = 'Account not found.';
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
              ? 'Use default: admin@evacai.com / adminpassword' 
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
                  placeholder="adminpassword"
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
                placeholder="e.g. user123" 
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