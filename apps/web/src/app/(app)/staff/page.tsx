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
    <>
      <header className="border-b px-4 py-5 sm:px-8 sm:py-6">
        <h1 className="text-balance font-heading text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user?.fullName ?? user?.username ?? "staff"}.
        </p>
      </header>
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <p className="text-muted-foreground text-sm">
          Reservations, service requests, and room status will appear here.
        </p>
      </div>
    </>
  );
}
