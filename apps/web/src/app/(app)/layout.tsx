import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { AppSidebar } from "./_components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@hotel/ui/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset id="main-content">
        <div className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b bg-background px-4 pt-[env(safe-area-inset-top)] md:hidden">
          <span className="font-heading font-semibold">Haven Hotel</span>
          <SidebarTrigger className="min-h-11 w-auto border px-4">Menu</SidebarTrigger>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
