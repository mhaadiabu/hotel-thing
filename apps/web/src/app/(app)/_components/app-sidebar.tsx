"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { roleHomePath, roleLabel, type Role } from "@hotel/backend/convex/lib/roles";
import {
  BedIcon,
  DashboardSquare03Icon,
  Home03Icon,
  Moon02Icon,
  Sun02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { Badge } from "@hotel/ui/components/badge";
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

type NavItem = { href: Route; label: string; icon: IconSvgElement };

const NAV_ITEMS: NavItem[] = [
  { href: "/" as Route, label: "Public site", icon: Home03Icon },
  { href: "/rooms" as Route, label: "Room inventory", icon: BedIcon },
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
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function roleBadgeVariant(r: Role): "default" | "secondary" | "outline" {
    if (r === "admin") return "default";
    if (r === "staff") return "secondary";
    return "outline";
  }

  const meta = user?.publicMetadata as { role?: unknown } | undefined;
  const role: Role = readRole(meta?.role);
  const dashboardHref: Route = roleHomePath(role) as Route;
  const dashboardLabel: string = roleLabel(role);

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
                    <HugeiconsIcon icon={item.icon} strokeWidth={1.8} />
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
                    <HugeiconsIcon icon={DashboardSquare03Icon} strokeWidth={1.8} />
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
                {role && (
                  <Badge variant={roleBadgeVariant(role)}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                )}
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
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <HugeiconsIcon
                icon={resolvedTheme === "dark" ? Sun02Icon : Moon02Icon}
                strokeWidth={1.8}
              />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
