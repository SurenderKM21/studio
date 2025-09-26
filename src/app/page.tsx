import { RoleSelector } from '@/components/auth/role-selector';
import { EvacAIIcon } from '@/components/icons';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="text-center">
        <div className="flex justify-center items-center gap-4 mb-4">
          <EvacAIIcon className="w-16 h-16 text-primary" />
          <h1 className="text-6xl font-headline font-bold text-primary">
            EvacAI
          </h1>
        </div>
        <p className="text-xl text-muted-foreground mb-12">
          Navigate smarter, not harder.
        </p>
        <p className="text-l text-muted-foreground mb-12">
          Please login or register to continue.
        </p>
      </div>
      <RoleSelector />
    </main>
  );
}
