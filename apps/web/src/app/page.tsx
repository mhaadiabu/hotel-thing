"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Route } from "next";

import { Button } from "@hotel/ui/components/button";
import { roleHomePath } from "@hotel/backend/convex/lib/roles";

export default function Home() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const me = useQuery(api.users.me);
  const healthCheck = useQuery(api.healthCheck.get);
  const router = useRouter();

  useEffect(() => {
    if (!userLoaded || !isSignedIn || !me) return;
    router.replace(roleHomePath(me.role) as Route);
  }, [userLoaded, isSignedIn, me, router]);

  if (userLoaded && isSignedIn) {
    return (
      <main className="min-h-svh px-8 py-20">
        <p className="text-muted-foreground text-sm">Redirecting.</p>
      </main>
    );
  }

  const statusLabel =
    healthCheck === undefined
      ? "Checking"
      : healthCheck === "OK"
        ? "Connected"
        : "Error";
  const statusTone =
    healthCheck === "OK"
      ? "bg-primary"
      : healthCheck === undefined
        ? "bg-muted-foreground/40"
        : "bg-destructive";

  return (
    <main className="min-h-svh px-8 py-20">
      <div className="grid max-w-2xl gap-10">
        <div className="font-semibold text-base tracking-tight">Hotel</div>
        <div className="grid gap-3">
          <h1 className="font-heading font-semibold text-4xl tracking-tight">
            Hotel operations
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to manage rooms, reservations, and guest services.
          </p>
        </div>
        <div>
          <SignInButton mode="modal">
            <Button size="lg">Sign in</Button>
          </SignInButton>
        </div>
        <div className="flex items-center gap-2 border-t pt-6 text-muted-foreground text-sm">
          <span aria-hidden className={`size-2 rounded-none ${statusTone}`} />
          <span>API {statusLabel.toLowerCase()}</span>
        </div>
      </div>
    </main>
  );
}
