
import { Header } from "@/components/layout/header";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* We pass a mock userId for now, this would come from a real auth session */}
      <Header section="User" userId="user-1" />
      <main className="flex-1">{children}</main>
    </div>
  );
}

    