"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { roleHomePath } from "@hotel/backend/convex/lib/roles";
import { Button } from "@hotel/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hotel/ui/components/card";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect } from "react";

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
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Redirecting.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="grid gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Hotel operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage rooms, reservations, and guest services.
          </p>
        </div>

        {!userLoaded ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">Loading.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Use your staff or guest account.</CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal">
                <Button>Sign in</Button>
              </SignInButton>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>API status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={`size-2 rounded-none ${
                  healthCheck === "OK"
                    ? "bg-primary"
                    : healthCheck === undefined
                      ? "bg-muted-foreground/40"
                      : "bg-destructive"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {healthCheck === undefined
                  ? "Checking"
                  : healthCheck === "OK"
                    ? "Connected"
                    : "Error"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
