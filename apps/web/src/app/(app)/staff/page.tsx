"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import type { Id } from "@hotel/backend/convex/_generated/dataModel";
import { Button } from "@hotel/ui/components/button";
import { Card, CardContent, CardFooter } from "@hotel/ui/components/card";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";

import { InlineAlert } from "@/components/inline-alert";
import { RoleGate } from "@/components/role-gate";
import { getAppError } from "@/lib/app-error";
import { formatDateTime } from "@/lib/format";

type StaffRequestRow = FunctionReturnType<typeof api.serviceRequests.listForStaff>[number];

const CATEGORY_LABELS = {
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  amenities: "Amenities",
  other: "Other",
} as const;

export default function StaffPage() {
  return (
    <RoleGate allow={["admin", "staff"]}>
      <StaffHome />
    </RoleGate>
  );
}

function StaffHome() {
  const { user } = useUser();
  const rows = useQuery(api.serviceRequests.listForStaff);
  const completeRequest = useMutation(api.serviceRequests.complete);
  const [pendingRequestId, setPendingRequestId] = useState<Id<"serviceRequests"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRows = rows?.filter(({ request }) => request.status !== "resolved");
  const completedRows = rows?.filter(({ request }) => request.status === "resolved");

  async function handleComplete(requestId: Id<"serviceRequests">) {
    setPendingRequestId(requestId);
    setError(null);
    try {
      await completeRequest({ requestId });
    } catch (cause) {
      setError(getAppError(cause, "The request could not be completed. Try again.").message);
    } finally {
      setPendingRequestId((current) => (current === requestId ? null : current));
    }
  }

  return (
    <>
      <header className="border-b px-4 py-5 sm:px-8 sm:py-6">
        <p className="text-xs font-medium uppercase text-muted-foreground">Guest services</p>
        <h1 className="mt-1 text-balance font-heading text-2xl font-semibold tracking-tight">
          Service desk
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user?.fullName ?? user?.username ?? "staff"}.
        </p>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        {error ? (
          <InlineAlert className="mb-6" title="The request was not completed" description={error} />
        ) : null}

        {rows === undefined ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : (
          <div className="grid gap-10">
            <section aria-labelledby="active-requests-heading">
              <h2 id="active-requests-heading" className="font-heading text-xl font-semibold">
                Needs attention
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeRows?.length
                  ? `${activeRows.length} ${activeRows.length === 1 ? "request" : "requests"} waiting`
                  : "No requests are waiting."}
              </p>

              {activeRows?.length ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {activeRows.map((row) => (
                    <RequestCard
                      key={row.request._id}
                      row={row}
                      pending={pendingRequestId === row.request._id}
                      onComplete={handleComplete}
                    />
                  ))}
                </div>
              ) : (
                <Card className="mt-4 border-dashed bg-muted/25 shadow-none">
                  <CardContent className="py-3 text-sm text-muted-foreground">
                    You are caught up. New guest requests will appear here.
                  </CardContent>
                </Card>
              )}
            </section>

            {completedRows?.length ? (
              <section aria-labelledby="completed-requests-heading">
                <h2 id="completed-requests-heading" className="font-heading text-xl font-semibold">
                  Completed
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recent requests that no longer need attention.
                </p>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {completedRows.map((row) => (
                    <CompletedRequestCard key={row.request._id} row={row} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

function RequestCard({
  row,
  pending,
  onComplete,
}: {
  row: StaffRequestRow;
  pending: boolean;
  onComplete: (requestId: Id<"serviceRequests">) => Promise<void>;
}) {
  const { request, reservation, roomNumber } = row;

  return (
    <Card className="shadow-sm">
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>{roomNumber ? `Room ${roomNumber}` : "Room unavailable"}</span>
          <span aria-hidden>·</span>
          <span>{CATEGORY_LABELS[request.category]}</span>
        </div>
        <p className="mt-4 break-words text-base leading-7">{request.details}</p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{reservation?.guestName ?? "Guest"}</span>
          <span>Requested {formatDateTime(request.createdAt)}</span>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <Button
          type="button"
          className="min-h-11 w-full sm:ml-auto sm:w-auto"
          disabled={pending}
          onClick={() => void onComplete(request._id)}
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden data-icon="inline-start" />
          {pending ? "Marking complete…" : "Mark complete"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function CompletedRequestCard({ row }: { row: StaffRequestRow }) {
  const { request, roomNumber } = row;
  const completion =
    request.completedByName && request.completedAt
      ? { name: request.completedByName, at: request.completedAt }
      : null;

  return (
    <Card size="sm" className="bg-muted/20 shadow-none">
      <CardContent className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-medium">{roomNumber ? `Room ${roomNumber}` : "Room unavailable"}</p>
            <span className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[request.category]}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">
            {request.details}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {completion ? (
              <>
                Completed by <span className="font-medium text-foreground">{completion.name}</span>
                <span className="block">{formatDateTime(completion.at)}</span>
              </>
            ) : (
              "Resolved by an admin"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
