"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { roleHomePath, roleLabel, type Role } from "@hotel/backend/convex/lib/roles";
import { useQuery } from "convex/react";
import { Bed, LayoutDashboard, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { Button } from "@hotel/ui/components/button";
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
} from "@hotel/ui/components/sidebar";

type NavItem = { href: Route; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/rooms" as Route, label: "Rooms", icon: Bed },
];

export function AppSidebar() {
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const me = useQuery(api.users.me);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const role: Role | null = me?.role ?? null;
  const dashboardHref: Route | null = role
    ? (roleHomePath(role) as Route)
    : null;
  const dashboardLabel: string | null = role ? roleLabel(role) : null;

  return (
    <Sidebar>
      <SidebarHeader className="h-16 border-b">
        <div className="flex h-full items-center px-4">
          <Link href="/" className="font-semibold text-base tracking-tight">
            Hotel
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {dashboardHref && dashboardLabel && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === dashboardHref}
                    render={<Link href={dashboardHref} />}
                  >
                    <LayoutDashboard />
                    <span>{dashboardLabel}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="border-t">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="min-w-0 flex-1">
            {userLoaded && isSignedIn ? (
              <div className="flex items-center gap-2">
                <UserButton />
                <span className="truncate text-xs text-muted-foreground">
                  {user?.fullName ?? user?.username ?? "user"}
                </span>
              </div>
            ) : userLoaded ? (
              <SignInButton mode="modal">
                <Button size="sm" className="w-full">
                  Sign in
                </Button>
              </SignInButton>
            ) : null}
          </div>
          {mounted && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle theme"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
