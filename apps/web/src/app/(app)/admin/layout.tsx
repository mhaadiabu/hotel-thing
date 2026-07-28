"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import { RoleGate } from "@/components/role-gate";
import { cn } from "@hotel/ui/lib/utils";

const TABS: { href: Route; label: string }[] = [
  { href: "/admin" as Route, label: "Rooms" },
  { href: "/admin/roles" as Route, label: "Roles" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <RoleGate allow={["admin"]}>
      <div>
        <nav className="flex items-center gap-6 border-b px-8">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "border-b-2 py-3 text-sm transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
