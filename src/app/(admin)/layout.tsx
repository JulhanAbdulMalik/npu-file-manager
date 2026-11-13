import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#f6f8fb]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
          <Header />
          <main className="flex-1 p-3 sm:p-4 md:p-5 w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
