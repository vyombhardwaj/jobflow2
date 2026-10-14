// app/(app)/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { JobScene } from "@/components/layout/JobScene";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="flex min-h-screen min-w-0">
      <JobScene />
      <Sidebar />
      <main className="relative z-10 min-h-screen min-w-0 w-full flex-1 pt-[calc(3.5rem+env(safe-area-inset-top))] lg:ml-64 lg:pt-0">
        <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-5 animate-enter sm:px-8 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
