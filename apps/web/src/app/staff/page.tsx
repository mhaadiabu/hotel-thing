"use client";

import { useUser } from "@clerk/nextjs";

import { RoleGate } from "@/components/role-gate";

export default function StaffPage() {
  return (
    <RoleGate allow={["admin", "staff"]}>
      <StaffHome />
    </RoleGate>
  );
}

function StaffHome() {
  const { user } = useUser();
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <div className="grid gap-6">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Staff</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {user?.fullName ?? user?.username ?? "staff"}.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Reservations, service requests, and room status will appear here.
        </p>
      </div>
    </main>
  );
}
