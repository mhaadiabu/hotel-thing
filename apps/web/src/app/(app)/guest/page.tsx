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
    <>
      <header className="border-b px-8 py-6">
        <h1 className="font-heading font-semibold text-2xl tracking-tight">My stay</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user?.fullName ?? user?.username ?? "guest"}.
        </p>
      </header>
      <div className="px-8 py-8">
        <p className="text-muted-foreground text-sm">
          Book a room, view reservations, and request services.
        </p>
      </div>
    </>
  );
}
