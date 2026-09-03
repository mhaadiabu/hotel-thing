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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@hotel/ui/components/sheet";

export function PublicHeader() {
  const { isSignedIn } = useUser();
  const me = useQuery(api.users.me);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/88 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:h-18 sm:gap-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-heading text-sm font-semibold tracking-tight min-[350px]:text-base sm:text-lg"
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
            <SheetTrigger
              render={<Button variant="outline" size="icon-lg" className="size-11 sm:hidden" />}
            >
              <HugeiconsIcon icon={Menu01Icon} aria-hidden />
              <span className="sr-only">Open navigation</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Browse Haven Hotel.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                <Button
                  variant="ghost"
                  className="min-h-11 justify-start sm:min-h-9"
                  nativeButton={false}
                  render={<Link href={"/stay" as Route} />}
                >
                  Rooms
                </Button>
                {isSignedIn && me ? (
                  <Button
                    variant="ghost"
                    className="min-h-11 justify-start sm:min-h-9"
                    nativeButton={false}
                    render={<Link href={roleHomePath(me.role) as Route} />}
                  >
                    {me.role === "guest" ? "My stays" : "Dashboard"}
                  </Button>
                ) : null}
              </nav>
              <SheetFooter className="gap-3">
                {mounted ? (
                  <Button
                    variant="ghost"
                    className="min-h-11 justify-start"
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  >
                    <HugeiconsIcon
                      icon={resolvedTheme === "dark" ? Sun02Icon : Moon02Icon}
                      aria-hidden
                      strokeWidth={1.8}
                    />
                    {resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"}
                  </Button>
                ) : null}
                <AccountMenu role={me?.role} />
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <div className="hidden items-center gap-2 sm:flex">
            {mounted ? (
              <Button
                variant="ghost"
                size="icon-lg"
                className="size-8"
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
            <AccountMenu compact />
          </div>
        </div>
      </div>
    </header>
  );
}
