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
      <SidebarInset>
        <div className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-heading font-semibold">Haven Hotel</span>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
