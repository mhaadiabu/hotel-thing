"use client";

import { api } from "@hotel/backend/convex/_generated/api";
import { Card } from "@hotel/ui/components/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@hotel/ui/components/select";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hotel/ui/components/table";
import { useMutation, useQuery } from "convex/react";

const STATUSES = ["open", "in_progress", "resolved"] as const;

export default function RequestsPage() {
  const rows = useQuery(api.serviceRequests.listForAdmin);
  const updateStatus = useMutation(api.serviceRequests.updateStatus);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs font-medium uppercase text-muted-foreground">Guest services</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold">Service requests</h1>
      <p className="mt-2 text-sm text-muted-foreground">Track housekeeping, maintenance, amenity, and other requests from booked guests.</p>
      <div className="mt-8">
        {rows === undefined ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No service requests yet.</p> : (
          <Card className="overflow-hidden py-0 shadow-sm"><div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Guest</TableHead><TableHead>Room</TableHead><TableHead>Category</TableHead><TableHead>Request</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(({ request, reservation, roomNumber }) => <TableRow key={request._id}>
              <TableCell><div className="min-w-40"><div className="font-medium">{reservation?.guestName ?? "Guest"}</div><div className="text-xs text-muted-foreground">{reservation?.guestEmail ?? "No email"}</div></div></TableCell>
              <TableCell>{roomNumber ? `Room ${roomNumber}` : "Unavailable"}</TableCell>
              <TableCell className="capitalize">{request.category}</TableCell>
              <TableCell><p className="min-w-56 max-w-md whitespace-normal">{request.details}</p></TableCell>
              <TableCell><Select value={request.status} onValueChange={(value) => { if (value) void updateStatus({ requestId: request._id, status: value as typeof STATUSES[number] }); }}><SelectTrigger size="sm" className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>)}</SelectGroup></SelectContent></Select></TableCell>
            </TableRow>)}</TableBody>
          </Table></div></Card>
        )}
      </div>
    </div>
  );
}
