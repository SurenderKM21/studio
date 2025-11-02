
import { Header } from "@/components/layout/header";
import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const userId = searchParams?.userId;

  if (typeof userId !== 'string') {
    redirect('/login');
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header section="Admin" userId={userId} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
