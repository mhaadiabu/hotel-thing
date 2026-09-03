"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import { RoleGate } from "@/components/role-gate";
import { cn } from "@hotel/ui/lib/utils";

const TABS: { href: Route; label: string }[] = [
  { href: "/admin" as Route, label: "Rooms" },
  { href: "/admin/reservations" as Route, label: "Reservations" },
  { href: "/admin/requests" as Route, label: "Requests" },
  { href: "/admin/roles" as Route, label: "Roles" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <RoleGate allow={["admin"]}>
      <div>
        <nav
          aria-label="Admin sections"
          className="flex items-center gap-5 overflow-x-auto overscroll-x-contain border-b px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6"
        >
          {TABS.map((tab) => {
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
