"use client";

import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hotel/ui/components/card";

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
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="grid gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">My stay</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.fullName ?? user?.username ?? "guest"}.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Reservations and services</CardTitle>
            <CardDescription>
              Book a room, view reservations, and request services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No active reservations.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
