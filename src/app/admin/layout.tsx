import { Header } from "@/components/layout/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header section="Admin" />
      <main className="flex-1">{children}</main>
    </div>
  );
}
