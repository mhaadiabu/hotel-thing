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
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Redirecting.</p>
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
    <main className="container mx-auto max-w-2xl px-4 py-16">
      <div className="grid gap-8">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Hotel operations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage rooms, reservations, and guest services.
          </p>
        </div>

        <div>
          <SignInButton mode="modal">
            <Button size="lg">Sign in</Button>
          </SignInButton>
        </div>

        <div className="flex items-center gap-2 border-t pt-6 text-sm text-muted-foreground">
          <span aria-hidden className={`size-2 rounded-none ${statusTone}`} />
          <span>API {statusLabel.toLowerCase()}</span>
        </div>
      </div>
    </main>
  );
}
