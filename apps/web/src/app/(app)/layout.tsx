import { AppSidebar } from "./_components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@hotel/ui/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
