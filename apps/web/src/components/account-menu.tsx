"use client";

import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@hotel/ui/components/badge";
import { Button } from "@hotel/ui/components/button";
import { type Role } from "@hotel/backend/convex/lib/roles";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "G"
  );
}

function avatarUrl(seed: string): string {
  return `https://api.navii.dev/avatar/${encodeURIComponent(seed)}?size=96&tileBg=auto`;
}

export function AccountMenu({ role, compact = false }: { role?: Role; compact?: boolean }) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!isLoaded) {
    return (
      <div className={compact ? "size-9 rounded-full bg-muted" : "h-12 rounded-xl bg-muted"} />
    );
  }

  if (!isSignedIn || !user) {
    return (
      <SignInButton mode="modal">
        <Button size="sm" variant="outline" className={compact ? "px-3" : "w-full"}>
          Sign in
        </Button>
      </SignInButton>
    );
  }

  const name = user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "Guest";
  const email = user.primaryEmailAddress?.emailAddress;
  const seed = user.id || email || name;
  const image = !avatarFailed ? (
    <img
      src={avatarUrl(seed)}
      alt=""
      width={compact ? 36 : 40}
      height={compact ? 36 : 40}
      className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border/80"
      onError={() => setAvatarFailed(true)}
    />
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-1 ring-border/80">
      {initials(name)}
    </span>
  );

  return (
    <div ref={menuRef} className={compact ? "relative" : "relative w-full"}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
        onClick={() => setOpen((value) => !value)}
        className={
          compact
            ? "flex items-center rounded-full outline-none transition-colors hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring"
            : "group flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        }
      >
        {image}
        {!compact && (
          <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {email ?? "Signed in"}
            </span>
          </span>
        )}
        {!compact && role && (
          <Badge
            variant="secondary"
            className="shrink-0 text-[10px] capitalize group-data-[collapsible=icon]:hidden"
          >
            {role}
          </Badge>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account actions"
          className={
            compact
              ? "absolute right-0 top-[calc(100%+0.5rem)] z-30 w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
              : "absolute bottom-[calc(100%+0.5rem)] left-0 z-30 w-64 rounded-xl border border-sidebar-border bg-popover p-1.5 text-popover-foreground shadow-lg group-data-[collapsible=icon]:left-0"
          }
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email ?? "Signed in"}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut({ redirectUrl: "/" }).catch(() => setSigningOut(false));
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 disabled:cursor-wait disabled:opacity-60"
          >
            <HugeiconsIcon icon={Logout03Icon} aria-hidden strokeWidth={1.8} />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
