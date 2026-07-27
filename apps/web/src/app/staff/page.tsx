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
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="grid gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.fullName ?? user?.username ?? "staff"}.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Queue</CardTitle>
            <CardDescription>
              Reservations, service requests, and room status will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The queue is empty.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
