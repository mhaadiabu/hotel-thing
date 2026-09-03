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
    <RoleGate allow={["admin", "staff"]}>
      <RoomsView />
    </RoleGate>
  );
}

function RoomsView() {
  const { user } = useUser();
  const rooms = useQuery(api.rooms.list);
  return (
    <>
      <header className="border-b px-4 py-5 sm:px-8 sm:py-6">
        <h1 className="text-balance font-heading text-2xl font-semibold tracking-tight">Rooms</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user?.fullName ?? user?.username ?? "guest"}.
        </p>
      </header>
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6">
          {rooms === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground text-sm">No rooms configured yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {rooms.map((room) => (
                  <Card key={room._id} size="sm" className="shadow-sm">
                    <div className="flex items-start justify-between gap-4 px-4">
                      <div className="min-w-0">
                        <p className="font-mono font-medium tabular-nums">Room {room.roomNumber}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{room.type}</p>
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {formatRate(room.nightlyRate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 border-t px-4 pt-4 text-sm">
                      <span
                        aria-hidden
                        className={`inline-block h-4 w-0.5 ${statusBar(room.status)}`}
                      />
                      <span>{room.status}</span>
                    </div>
                  </Card>
                ))}
              </div>
              <Card className="hidden overflow-hidden rounded-xl py-0 shadow-sm md:flex">
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
                      <TableRow key={r._id} className="hover:bg-muted/50">
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
