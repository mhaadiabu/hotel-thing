"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@hotel/backend/convex/_generated/api";
import { Card, CardContent } from "@hotel/ui/components/card";
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

function statusBar(s: string): string {
  if (s === "Available") return "bg-primary";
  if (s === "Maintenance") return "bg-destructive";
  if (s === "Occupied") return "bg-foreground/50";
  return "bg-foreground/25";
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
    <main className="container mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-8">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Rooms</h1>
          <p className="mt-2 text-sm text-muted-foreground">
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
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((r) => (
                  <TableRow key={r._id} className="border-b-0 hover:bg-muted/50">
                    <TableCell className="font-medium font-mono tabular-nums">
                      {r.roomNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.type}</TableCell>
                    <TableCell className="tabular-nums text-right">
                      {formatRate(r.nightlyRate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`inline-block h-4 w-0.5 ${statusBar(r.status)}`}
                        />
                        <span>{r.status}</span>
                      </div>
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
