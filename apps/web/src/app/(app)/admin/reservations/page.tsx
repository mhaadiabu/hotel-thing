"use client";

import { api } from "@hotel/backend/convex/_generated/api";
import { Badge } from "@hotel/ui/components/badge";
import { Card } from "@hotel/ui/components/card";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hotel/ui/components/table";
import { useQuery } from "convex/react";

import { formatGHS } from "@/lib/format";
import { calculateNights } from "@/lib/rooms";

export default function ReservationsPage() {
  const rows = useQuery(api.reservations.listForAdmin);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs font-medium uppercase text-muted-foreground">Bookings</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold">Reservations</h1>
      <p className="mt-2 text-sm text-muted-foreground">See who booked each room, their dates, stay length, and booking value.</p>
      <div className="mt-8">
        {rows === undefined ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No reservations yet.</p> : (
          <Card className="overflow-hidden py-0 shadow-sm"><div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Guest</TableHead><TableHead>Room</TableHead><TableHead>Stay</TableHead><TableHead>Nights</TableHead><TableHead>Guests</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(({ reservation, room }) => <TableRow key={reservation._id}>
              <TableCell><div className="min-w-44"><div className="font-medium">{reservation.guestName ?? "Guest"}</div><div className="text-xs text-muted-foreground">{reservation.guestEmail ?? "No email"}</div></div></TableCell>
              <TableCell>{room ? `${room.name ?? room.type} · ${room.roomNumber}` : "Removed room"}</TableCell>
              <TableCell className="whitespace-nowrap">{reservation.checkIn} to {reservation.checkOut}</TableCell>
              <TableCell>{calculateNights(reservation.checkIn, reservation.checkOut)}</TableCell>
              <TableCell>{reservation.guestCount}</TableCell>
              <TableCell className="tabular-nums">{formatGHS(reservation.totalAmount)}</TableCell>
              <TableCell><Badge variant={reservation.status === "confirmed" ? "default" : "secondary"}>{reservation.status}</Badge></TableCell>
            </TableRow>)}</TableBody>
          </Table></div></Card>
        )}
      </div>
    </div>
  );
}
