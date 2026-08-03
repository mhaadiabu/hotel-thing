"use client";

import { api } from "@hotel/backend/convex/_generated/api";
import { Badge } from "@hotel/ui/components/badge";
import { Button } from "@hotel/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@hotel/ui/components/card";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { useQuery } from "convex/react";
import Link from "next/link";

import { RoleGate } from "@/components/role-gate";
import { formatGHS } from "@/lib/format";

export default function GuestPage() {
  return (
    <RoleGate allow={["admin", "staff", "guest"]}>
      <GuestHome />
    </RoleGate>
  );
}

function GuestHome() {
  const stays = useQuery(api.reservations.mine);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">Your account</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">My stays</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Confirmed and past reservations appear here.
        </p>
      </div>

      {stays === undefined ? (
        <div className="mt-8 grid gap-4">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : stays.length === 0 ? (
        <Card className="mt-8 rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl font-semibold">
              No stays booked yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse the available rooms and choose one for your next visit.
            </p>
            <Button className="mt-6" render={<Link href="/#rooms" />}>
              Find a room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4">
          {stays.map(({ reservation, room }) => (
            <Card key={reservation._id} className="rounded-3xl shadow-sm">
              <CardContent className="grid gap-5 py-1 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-xl font-semibold">
                      {room?.name ?? room?.type ?? "Hotel room"}
                    </h2>
                    <Badge variant={reservation.status === "confirmed" ? "default" : "secondary"}>
                      {reservation.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {reservation.checkIn} to {reservation.checkOut}
                    {room ? ` · Room ${room.roomNumber}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {reservation.guestCount} guest{reservation.guestCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="font-heading text-xl font-semibold tabular-nums">
                  {formatGHS(reservation.totalAmount)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
