
import { Header } from "@/components/layout/header";

export default function AdminLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const userId = searchParams?.userId as string | undefined;

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header section="Admin" userId={userId} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
