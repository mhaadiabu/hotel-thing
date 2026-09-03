"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useQuery } from "convex/react";

import { RoleGate } from "@/components/role-gate";
import { api } from "@hotel/backend/convex/_generated/api";
import { cn } from "@hotel/ui/lib/utils";

const TABS: { href: Route; label: string; adminOnly?: boolean }[] = [
  { href: "/admin" as Route, label: "Rooms", adminOnly: true },
  { href: "/admin/reservations" as Route, label: "Reservations" },
  { href: "/admin/requests" as Route, label: "Requests" },
  { href: "/admin/roles" as Route, label: "Roles", adminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const me = useQuery(api.users.me);
  const tabs = TABS.filter((tab) => !tab.adminOnly || me?.role === "admin");

  return (
    <RoleGate allow={["admin", "staff"]}>
      <div>
        <nav
          aria-label="Admin sections"
          className="flex items-center gap-5 overflow-x-auto overscroll-x-contain border-b px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6"
        >
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "shrink-0 border-b-2 py-3.5 text-sm transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </RoleGate>
  );
}
