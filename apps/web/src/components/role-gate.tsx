"use client";

import { RedirectToSignIn, useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { roleHomePath, type Role } from "@hotel/backend/convex/lib/roles";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, type ReactNode } from "react";

type RoleGateProps = {
  allow: readonly Role[];
  children: ReactNode;
};

export function RoleGate({ allow, children }: RoleGateProps) {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const me = useQuery(api.users.me);
  const router = useRouter();

  const authLoaded = userLoaded && me !== undefined;

  useEffect(() => {
    if (!authLoaded || !isSignedIn || !me) return;
    if (!allow.includes(me.role)) {
      router.replace(roleHomePath(me.role) as Route);
    }
  }, [authLoaded, isSignedIn, me, allow, router]);

  if (!authLoaded) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (me && !allow.includes(me.role)) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
