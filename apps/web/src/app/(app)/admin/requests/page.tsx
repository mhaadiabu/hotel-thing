"use client";

import { api } from "@hotel/backend/convex/_generated/api";
import { Card } from "@hotel/ui/components/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hotel/ui/components/select";
import { Skeleton } from "@hotel/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hotel/ui/components/table";
import { useMutation, useQuery } from "convex/react";

const STATUSES = ["open", "in_progress", "resolved"] as const;
const STATUS_LABELS = { open: "Open", in_progress: "In progress", resolved: "Resolved" } as const;

const STATUS_STYLES = {
  open: {
    dot: "bg-rose-500",
    control: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  in_progress: {
    dot: "bg-amber-500",
    control: "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  resolved: {
    dot: "bg-emerald-500",
    control: "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
} as const;

export default function RequestsPage() {
  const rows = useQuery(api.serviceRequests.listForAdmin);
  const updateStatus = useMutation(api.serviceRequests.updateStatus);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs font-medium uppercase text-muted-foreground">Guest services</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold">Service requests</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Track housekeeping, maintenance, amenity, and other requests from booked guests.
      </p>
      <div className="mt-8">
        {rows === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No service requests yet.</p>
        ) : (
          <Card className="overflow-hidden py-0 shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ request, reservation, roomNumber }) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="flex min-w-40 items-center gap-3">
                          <RequestStatusDot status={request.status} />
                          <div>
                            <div className="font-medium">{reservation?.guestName ?? "Guest"}</div>
                            <div className="text-xs text-muted-foreground">
                              {reservation?.guestEmail ?? "No email"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{roomNumber ? `Room ${roomNumber}` : "Unavailable"}</TableCell>
                      <TableCell className="capitalize">{request.category}</TableCell>
                      <TableCell>
                        <p className="min-w-56 max-w-md whitespace-normal">{request.details}</p>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={request.status}
                          onValueChange={(value) => {
                            if (value)
                              void updateStatus({
                                requestId: request._id,
                                status: value as (typeof STATUSES)[number],
                              });
                          }}
                        >
                          <SelectTrigger
                            size="sm"
                            className={`w-36 border ${STATUS_STYLES[request.status].control}`}
                          >
                            <span
                              className={`size-2 rounded-full ${STATUS_STYLES[request.status].dot}`}
                              aria-hidden="true"
                            />
                            <SelectValue>{STATUS_LABELS[request.status]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  <span
                                    className={`size-2 rounded-full ${STATUS_STYLES[status].dot}`}
                                    aria-hidden="true"
                                  />
                                  {STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function RequestStatusDot({ status }: { status: (typeof STATUSES)[number] }) {
  const { dot } = STATUS_STYLES[status];
  const isActive = status !== "resolved";

  return (
    <span className="relative flex size-2.5 shrink-0" aria-label={STATUS_LABELS[status]}>
      {isActive ? (
        <span
          className={`absolute inset-0 motion-safe:animate-ping rounded-full opacity-60 ${dot}`}
        />
      ) : null}
      <span className={`relative size-2.5 rounded-full ring-2 ring-background ${dot}`} />
    </span>
  );
}
