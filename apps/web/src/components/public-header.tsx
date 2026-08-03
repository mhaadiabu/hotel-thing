"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { roleHomePath } from "@hotel/backend/convex/lib/roles";
import { Hotel01Icon, Moon02Icon, Sun02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { AccountMenu } from "@/components/account-menu";
import { Button } from "@hotel/ui/components/button";

export function PublicHeader() {
  const { isLoaded, isSignedIn } = useUser();
  const me = useQuery(api.users.me);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <HugeiconsIcon icon={Hotel01Icon} aria-hidden strokeWidth={1.8} />
          Haven Hotel
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
          <Link href="/#rooms" className="transition-colors hover:text-foreground">
            Rooms
          </Link>
          {isSignedIn && me ? (
            <Link
              href={roleHomePath(me.role) as Route}
              className="transition-colors hover:text-foreground"
            >
              {me.role === "guest" ? "My stays" : "Dashboard"}
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          {mounted ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle color theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <HugeiconsIcon
                icon={resolvedTheme === "dark" ? Sun02Icon : Moon02Icon}
                aria-hidden
                strokeWidth={1.8}
              />
            </Button>
          ) : null}
          {isLoaded ? <AccountMenu compact /> : null}
        </div>
      </div>
    </header>
  );
}
