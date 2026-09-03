"use client";

import { useState } from "react";

import { api } from "@hotel/backend/convex/_generated/api";
import type { Id } from "@hotel/backend/convex/_generated/dataModel";
import { Badge } from "@hotel/ui/components/badge";
import { Button } from "@hotel/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@hotel/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@hotel/ui/components/dialog";
import { Label } from "@hotel/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hotel/ui/components/select";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { Textarea } from "@hotel/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";

import { InlineAlert } from "@/components/inline-alert";
import { RoleGate } from "@/components/role-gate";
import { getAppError } from "@/lib/app-error";
import { formatDate, formatGHS } from "@/lib/format";

const CATEGORY_LABELS = {
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  amenities: "Amenities",
  other: "Other",
} as const;

export default function GuestPage() {
  return (
    <RoleGate allow={["admin", "staff", "guest"]}>
      <GuestHome />
    </RoleGate>
  );
}

function GuestHome() {
  const stays = useQuery(api.reservations.mine);
  const requests = useQuery(api.serviceRequests.mine);
  const createRequest = useMutation(api.serviceRequests.create);
  const [requestStayId, setRequestStayId] = useState<Id<"reservations"> | null>(null);
  const [category, setCategory] = useState<keyof typeof CATEGORY_LABELS>("housekeeping");
  const [details, setDetails] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestPending, setRequestPending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function handleRequest() {
    if (!requestStayId) return;

    setRequestPending(true);
    setRequestError(null);
    try {
      await createRequest({ reservationId: requestStayId, category, details });
      setRequestStayId(null);
    } catch (error) {
      setRequestError(
        getAppError(error, "We could not send your request. Check your connection and try again.")
          .message,
      );
    } finally {
      setRequestPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">Your account</p>
        <h1 className="mt-2 text-balance font-heading text-3xl font-semibold tracking-tight">
          My stays
        </h1>
        <p className="mt-3 text-pretty leading-7 text-muted-foreground">
          Upcoming, current, cancelled, and past reservations appear here.
        </p>
      </div>

      {stays === undefined ? (
        <div className="mt-8 grid gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : stays.length === 0 ? (
        <Card className="mt-8 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl font-semibold">
              No stays booked yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse the available rooms and choose one for your next visit.
            </p>
            <Button
              className="mt-6 w-full sm:w-auto"
              nativeButton={false}
              render={<Link href="/stay" />}
            >
              Find a room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mt-8 text-sm text-muted-foreground">
            Help requests become available during your stay.
          </p>
          <div className="mt-4 grid gap-4">
            {stays.map(({ reservation, room }) => {
              const canRequestHelp =
                reservation.status === "confirmed" &&
                reservation.checkIn <= today &&
                today < reservation.checkOut;

              return (
                <Card key={reservation._id} className="shadow-sm">
                  <CardContent className="grid min-w-0 gap-5 py-1 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-balance font-heading text-xl font-semibold">
                          {room?.name ?? room?.type ?? "Hotel room"}
                        </h2>
                        <Badge
                          variant={reservation.status === "confirmed" ? "default" : "secondary"}
                        >
                          {reservation.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatDate(reservation.checkIn)} to {formatDate(reservation.checkOut)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {room ? `Room ${room.roomNumber} · ` : ""}
                        {reservation.guestCount} guest{reservation.guestCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="font-heading text-xl font-semibold tabular-nums">
                      {formatGHS(reservation.totalAmount)}
                    </div>
                    {canRequestHelp ? (
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setRequestStayId(reservation._id);
                          setDetails("");
                          setRequestError(null);
                        }}
                      >
                        Request help
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {requests?.length ? (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold">Your requests</h2>
          <div className="mt-4 grid gap-3">
            {requests.map((request) => (
              <Card key={request._id}>
                <CardContent className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium capitalize">{request.category}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {request.details}
                    </p>
                  </div>
                  <Badge
                    className="w-fit"
                    variant={request.status === "resolved" ? "secondary" : "default"}
                  >
                    {request.status.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Dialog
        open={requestStayId !== null}
        onOpenChange={(value) => {
          if (!value && !requestPending) setRequestStayId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request help</DialogTitle>
            <DialogDescription>
              Tell the hotel team what you need during this stay.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="request-type">Request type</Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  if (value) setCategory(value as typeof category);
                }}
              >
                <SelectTrigger id="request-type">
                  <SelectValue>{CATEGORY_LABELS[category]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="request-details">Details</Label>
              <Textarea
                id="request-details"
                name="requestDetails"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="What should the team know?"
              />
            </div>
            {requestError ? (
              <InlineAlert title="We could not send your request" description={requestError} />
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={requestPending}
              onClick={() => setRequestStayId(null)}
            >
              Cancel
            </Button>
            <Button disabled={requestPending} onClick={() => void handleRequest()}>
              {requestPending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
