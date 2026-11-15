import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminLayoutContainer from "@/components/layout/AdminLayoutContainer";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  return (
    <SidebarProvider>
      <AdminLayoutContainer>
        {children}
      </AdminLayoutContainer>
    </SidebarProvider>
  );
}
