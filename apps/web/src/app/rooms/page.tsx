"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@hotel/backend/convex/_generated/api";
import { Badge } from "@hotel/ui/components/badge";
import {
  Card,
  CardContent,
} from "@hotel/ui/components/card";
import { Skeleton } from "@hotel/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hotel/ui/components/table";
import { formatRate } from "@/lib/format";

import { RoleGate } from "@/components/role-gate";

function statusVariant(
  s: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "Available") return "default";
  if (s === "Maintenance") return "destructive";
  if (s === "Occupied") return "secondary";
  return "outline";
}

export default function RoomsPage() {
  return (
    <RoleGate allow={["admin", "staff", "guest"]}>
      <RoomsView />
    </RoleGate>
  );
}

function RoomsView() {
  const { user } = useUser();
  const rooms = useQuery(api.rooms.list);
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.fullName ?? user?.username ?? "guest"}.
          </p>
        </div>
        {rooms === undefined ? (
          <Skeleton className="h-40 w-full" />
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">No rooms configured yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.roomNumber}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{formatRate(r.nightlyRate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </main>
  );
}
