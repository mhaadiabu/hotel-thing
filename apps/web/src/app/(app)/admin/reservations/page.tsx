"use client";

import { api } from "@hotel/backend/convex/_generated/api";
import { Badge } from "@hotel/ui/components/badge";
import { Card } from "@hotel/ui/components/card";
import { Skeleton } from "@hotel/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hotel/ui/components/table";
import { useQuery } from "convex/react";

import { formatDate, formatGHS } from "@/lib/format";
import { calculateNights } from "@/lib/rooms";

export default function ReservationsPage() {
  const me = useQuery(api.users.me);
  const rows = useQuery(
    me?.role === "admin" ? api.reservations.listForAdmin : api.reservations.listForStaff,
    me ? {} : "skip",
  );
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs font-medium uppercase text-muted-foreground">Bookings</p>
      <h1 className="mt-1 text-balance font-heading text-3xl font-semibold">Reservations</h1>
      <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
        See who booked each room, their dates, stay length, and booking value.
      </p>
      <div className="mt-8">
        {rows === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reservations yet.</p>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {rows.map(({ reservation, payment, room }) => (
                <Card key={reservation._id} size="sm" className="shadow-sm">
                  <div className="flex min-w-0 items-start justify-between gap-3 px-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{reservation.guestName ?? "Guest"}</p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {reservation.guestEmail ?? "No email"}
                      </p>
                    </div>
                    <Badge variant={reservation.status === "confirmed" ? "default" : "secondary"}>
                      {reservation.status}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t px-4 pt-4 text-sm">
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Room</dt>
                      <dd className="mt-1">
                        {room ? `${room.name ?? room.type} · ${room.roomNumber}` : "Removed room"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Stay</dt>
                      <dd className="mt-1">
                        {formatDate(reservation.checkIn)} to {formatDate(reservation.checkOut)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Guests</dt>
                      <dd className="mt-1 tabular-nums">{reservation.guestCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Total</dt>
                      <dd className="mt-1 font-medium tabular-nums">
                        {formatGHS(reservation.totalAmount)}
                      </dd>
                    </div>
                  </dl>
                  <div className="px-4">
                    {payment ? (
                      <Badge variant="secondary">
                        Mock paid · {payment.method.replace("_", " ")}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Legacy booking</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <Card className="hidden overflow-hidden py-0 shadow-sm md:flex">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Stay</TableHead>
                      <TableHead>Nights</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(({ reservation, payment, room }) => (
                      <TableRow key={reservation._id}>
                        <TableCell>
                          <div className="min-w-44">
                            <div className="font-medium">{reservation.guestName ?? "Guest"}</div>
                            <div className="text-xs text-muted-foreground">
                              {reservation.guestEmail ?? "No email"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {room ? `${room.name ?? room.type} · ${room.roomNumber}` : "Removed room"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(reservation.checkIn)} to {formatDate(reservation.checkOut)}
                        </TableCell>
                        <TableCell>
                          {calculateNights(reservation.checkIn, reservation.checkOut)}
                        </TableCell>
                        <TableCell>{reservation.guestCount}</TableCell>
                        <TableCell className="tabular-nums">
                          {formatGHS(reservation.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {payment ? (
                            <Badge variant="secondary">
                              Mock paid · {payment.method.replace("_", " ")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Legacy booking</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={reservation.status === "confirmed" ? "default" : "secondary"}
                          >
                            {reservation.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
