"use client";

import { useState } from "react";

import { api } from "@hotel/backend/convex/_generated/api";
import type { Id } from "@hotel/backend/convex/_generated/dataModel";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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

import { InlineAlert } from "@/components/inline-alert";
import { getAppError } from "@/lib/app-error";
import { formatDateTime } from "@/lib/format";

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
  const [pendingRequestId, setPendingRequestId] = useState<Id<"serviceRequests"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(
    requestId: Id<"serviceRequests">,
    status: (typeof STATUSES)[number],
  ) {
    setPendingRequestId(requestId);
    setError(null);
    try {
      await updateStatus({ requestId, status });
    } catch (cause) {
      setError(getAppError(cause, "The request status could not be updated. Try again.").message);
    } finally {
      setPendingRequestId((current) => (current === requestId ? null : current));
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs font-medium uppercase text-muted-foreground">Guest services</p>
      <h1 className="mt-1 text-balance font-heading text-3xl font-semibold">Service requests</h1>
      <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
        Track housekeeping, maintenance, amenity, and other requests from booked guests.
      </p>
      {error ? (
        <InlineAlert
          className="mt-4"
          title="The request status was not updated"
          description={error}
        />
      ) : null}
      <div className="mt-8">
        {rows === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No service requests yet.</p>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {rows.map(({ request, reservation, roomNumber }) => (
                <Card key={request._id} size="sm" className="shadow-sm">
                  <div className="flex min-w-0 items-start gap-3 px-4">
                    <RequestStatusDot status={request.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-medium">{reservation?.guestName ?? "Guest"}</p>
                        <span className="text-xs text-muted-foreground">
                          {roomNumber ? `Room ${roomNumber}` : "Room unavailable"}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {reservation?.guestEmail ?? "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="border-t px-4 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {request.category}
                    </p>
                    <p className="mt-2 break-words leading-6">{request.details}</p>
                  </div>
                  <div className="px-4">
                    <RequestStatusSelect
                      requestId={request._id}
                      status={request.status}
                      disabled={pendingRequestId === request._id}
                      onChange={handleStatusChange}
                      className="w-full"
                    />
                    <CompletionReceipt
                      completedByName={request.completedByName}
                      completedAt={request.completedAt}
                    />
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
                          <RequestStatusSelect
                            requestId={request._id}
                            status={request.status}
                            disabled={pendingRequestId === request._id}
                            onChange={handleStatusChange}
                          />
                          <CompletionReceipt
                            completedByName={request.completedByName}
                            completedAt={request.completedAt}
                          />
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

function CompletionReceipt({
  completedByName,
  completedAt,
}: {
  completedByName?: string;
  completedAt?: number;
}) {
  if (!completedByName || !completedAt) return null;

  return (
    <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
      <HugeiconsIcon
        icon={CheckmarkCircle02Icon}
        className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden
        strokeWidth={2}
      />
      <span>
        Completed by <span className="font-medium text-foreground">{completedByName}</span>
        <span className="block">{formatDateTime(completedAt)}</span>
      </span>
    </div>
  );
}

function RequestStatusSelect({
  requestId,
  status,
  disabled,
  onChange,
  className = "w-36",
}: {
  requestId: Id<"serviceRequests">;
  status: (typeof STATUSES)[number];
  disabled: boolean;
  onChange: (requestId: Id<"serviceRequests">, status: (typeof STATUSES)[number]) => Promise<void>;
  className?: string;
}) {
  return (
    <Select
      value={status}
      disabled={disabled}
      onValueChange={(value) => {
        if (value) void onChange(requestId, value as (typeof STATUSES)[number]);
      }}
    >
      <SelectTrigger size="sm" className={`border ${STATUS_STYLES[status].control} ${className}`}>
        <span className={`size-2 rounded-full ${STATUS_STYLES[status].dot}`} aria-hidden="true" />
        <SelectValue>{STATUS_LABELS[status]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {STATUSES.map((nextStatus) => (
            <SelectItem key={nextStatus} value={nextStatus}>
              <span
                className={`size-2 rounded-full ${STATUS_STYLES[nextStatus].dot}`}
                aria-hidden="true"
              />
              {STATUS_LABELS[nextStatus]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
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
