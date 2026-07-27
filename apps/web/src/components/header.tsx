"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { roleHomePath, roleLabel, type Role } from "@hotel/backend/convex/lib/roles";
import { useQuery } from "convex/react";
import Link from "next/link";
import type { Route } from "next";

export default function Header() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const me = useQuery(api.users.me);
  const role: Role | null = me?.role ?? null;

  const dashboardHref = role ? roleHomePath(role) : "/";
  const dashboardLabel = role ? roleLabel(role) : null;

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <Link href="/" className="font-semibold text-base tracking-tight">
        Hotel
      </Link>
      <div className="flex items-center gap-6 text-sm">
        {userLoaded && isSignedIn && (
          <Link href={"/rooms" as Route} className="text-muted-foreground hover:text-foreground">
            Rooms
          </Link>
        )}
        {dashboardLabel && (
          <Link href={dashboardHref as Route} className="text-muted-foreground hover:text-foreground">
            {dashboardLabel}
          </Link>
        )}
        {userLoaded && (isSignedIn ? <UserButton /> : <SignInButton mode="modal" />)}
      </div>
    </header>
  );
}
