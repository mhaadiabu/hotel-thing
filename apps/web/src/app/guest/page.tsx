"use client";

import { useUser } from "@clerk/nextjs";

import { RoleGate } from "@/components/role-gate";

export default function GuestPage() {
  return (
    <RoleGate allow={["admin", "staff", "guest"]}>
      <GuestHome />
    </RoleGate>
  );
}

function GuestHome() {
  const { user } = useUser();
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <div className="grid gap-6">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">My stay</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {user?.fullName ?? user?.username ?? "guest"}.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Book a room, view reservations, and request services.
        </p>
      </div>
    </main>
  );
}
