// app/(app)/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-56 min-h-screen pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 animate-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
