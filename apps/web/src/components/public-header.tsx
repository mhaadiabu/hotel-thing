"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { roleHomePath } from "@hotel/backend/convex/lib/roles";
import { Hotel01Icon, Menu01Icon, Moon02Icon, Sun02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { AccountMenu } from "@/components/account-menu";
import { Button } from "@hotel/ui/components/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@hotel/ui/components/sheet";

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
          <Link href={"/stay" as Route} className="transition-colors hover:text-foreground">
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
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon-sm" className="sm:hidden" />}>
              <HugeiconsIcon icon={Menu01Icon} aria-hidden />
              <span className="sr-only">Open navigation</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader><SheetTitle>Navigation</SheetTitle><SheetDescription>Browse Haven Hotel.</SheetDescription></SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                <Button variant="ghost" className="justify-start" nativeButton={false} render={<Link href={"/stay" as Route} />}>Rooms</Button>
                {isSignedIn && me ? <Button variant="ghost" className="justify-start" nativeButton={false} render={<Link href={roleHomePath(me.role) as Route} />}>{me.role === "guest" ? "My stays" : "Dashboard"}</Button> : null}
              </nav>
            </SheetContent>
          </Sheet>
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
