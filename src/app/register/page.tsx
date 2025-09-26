import { RegisterForm } from '@/components/auth/register-form';
import { EvacAIIcon } from '@/components/icons';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
           <Link href="/" className="flex items-center gap-2">
            <EvacAIIcon className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-headline font-bold text-primary">
              EvacAI
            </h1>
          </Link>
        </div>
        <p className="text-xl text-muted-foreground">
          Create an account to get started.
        </p>
      </div>
      <RegisterForm />
    </main>
  );
}
