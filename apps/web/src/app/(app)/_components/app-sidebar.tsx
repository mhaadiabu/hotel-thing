"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { roleHomePath, roleLabel, type Role } from "@hotel/backend/convex/lib/roles";
import {
  BedIcon,
  Calendar03Icon,
  DashboardSquare03Icon,
  Home03Icon,
  Moon02Icon,
  NoteDoneIcon,
  Sun02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { Button } from "@hotel/ui/components/button";
import { AccountMenu } from "@/components/account-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@hotel/ui/components/sidebar";

type NavItem = { href: Route; label: string; icon: IconSvgElement; roles: readonly Role[] };

const NAV_ITEMS: NavItem[] = [
  {
    href: "/" as Route,
    label: "Public site",
    icon: Home03Icon,
    roles: ["guest", "staff", "admin"],
  },
  { href: "/rooms" as Route, label: "Room inventory", icon: BedIcon, roles: ["staff", "admin"] },
  {
    href: "/admin/reservations" as Route,
    label: "Reservations",
    icon: Calendar03Icon,
    roles: ["staff", "admin"],
  },
  {
    href: "/admin/requests" as Route,
    label: "Requests",
    icon: NoteDoneIcon,
    roles: ["staff", "admin"],
  },
];

function readRole(value: unknown): Role {
  if (value === "admin" || value === "staff" || value === "guest") {
    return value;
  }
  return "guest";
}

export function AppSidebar() {
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();
  const me = useQuery(api.users.me);
  const { resolvedTheme, setTheme } = useTheme();
  const { setOpenMobile } = useSidebar();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const meta = user?.publicMetadata as { role?: unknown } | undefined;
  const role: Role = me?.role ?? readRole(meta?.role);
  const dashboardHref: Route = roleHomePath(role) as Route;
  const dashboardLabel: string = roleLabel(role);

  return (
    <Sidebar>
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <div className="flex h-full items-center px-4">
          <Link
            href="/"
            className="font-heading text-base font-semibold tracking-tight text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            Haven Hotel
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
                  >
                    <HugeiconsIcon icon={item.icon} aria-hidden strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {dashboardHref && dashboardLabel && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === dashboardHref}
                    render={<Link href={dashboardHref} onClick={() => setOpenMobile(false)} />}
                  >
                    <HugeiconsIcon icon={DashboardSquare03Icon} aria-hidden strokeWidth={1.8} />
                    <span>{dashboardLabel}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            {userLoaded ? <AccountMenu role={isSignedIn ? role : undefined} /> : null}
          </div>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Toggle color theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <HugeiconsIcon
                icon={resolvedTheme === "dark" ? Sun02Icon : Moon02Icon}
                aria-hidden
                strokeWidth={1.8}
              />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
