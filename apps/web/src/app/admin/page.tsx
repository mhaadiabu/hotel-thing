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

export default function AdminPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminHome />
    </RoleGate>
  );
}

function AdminHome() {
  const { user } = useUser();
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="grid gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.fullName ?? user?.username ?? "admin"}.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Rooms, staff, reservations, and requests will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nothing to manage yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
