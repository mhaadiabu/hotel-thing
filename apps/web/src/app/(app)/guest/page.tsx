"use client";

import { useState } from "react";

import { api } from "@hotel/backend/convex/_generated/api";
import { Badge } from "@hotel/ui/components/badge";
import { Button } from "@hotel/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@hotel/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@hotel/ui/components/dialog";
import { Label } from "@hotel/ui/components/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@hotel/ui/components/select";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { Textarea } from "@hotel/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";

import { RoleGate } from "@/components/role-gate";
import { formatGHS } from "@/lib/format";

const CATEGORY_LABELS = { housekeeping: "Housekeeping", maintenance: "Maintenance", amenities: "Amenities", other: "Other" } as const;

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
  const [requestStayId, setRequestStayId] = useState<string | null>(null);
  const [category, setCategory] = useState<"housekeeping" | "maintenance" | "amenities" | "other">("housekeeping");
  const [details, setDetails] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestPending, setRequestPending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">Your account</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">My stays</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
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
            <Button className="mt-6" render={<Link href="/rooms" />}>
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
            {stays.map(({ reservation, room }) => (
              <Card key={reservation._id} className="shadow-sm">
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
                  {reservation.status === "confirmed" &&
                  reservation.checkIn <= today &&
                  today < reservation.checkOut ? (
                    <Button
                      variant="outline"
                      size="sm"
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
            ))}
          </div>
        </>
      )}

      {requests?.length ? <section className="mt-10"><h2 className="font-heading text-xl font-semibold">Your requests</h2><div className="mt-4 grid gap-3">{requests.map((request) => <Card key={request._id}><CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium capitalize">{request.category}</p><p className="text-sm text-muted-foreground">{request.details}</p></div><Badge variant={request.status === "resolved" ? "secondary" : "default"}>{request.status.replace("_", " ")}</Badge></CardContent></Card>)}</div></section> : null}

      <Dialog open={requestStayId !== null} onOpenChange={(value) => { if (!value) setRequestStayId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request help</DialogTitle><DialogDescription>Tell the hotel team what you need during this stay.</DialogDescription></DialogHeader>
          <div className="grid gap-4"><div className="flex flex-col gap-2"><Label>Request type</Label><Select value={category} onValueChange={(value) => { if (value) setCategory(value as typeof category); }}><SelectTrigger><SelectValue>{CATEGORY_LABELS[category]}</SelectValue></SelectTrigger><SelectContent><SelectGroup>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select></div><div className="flex flex-col gap-2"><Label htmlFor="request-details">Details</Label><Textarea id="request-details" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="What should the team know?" /></div>{requestError ? <p className="text-sm text-destructive">{requestError}</p> : null}</div>
          <DialogFooter><Button variant="outline" onClick={() => setRequestStayId(null)}>Cancel</Button><Button disabled={requestPending} onClick={async () => { if (!requestStayId) return; setRequestPending(true); setRequestError(null); try { await createRequest({ reservationId: requestStayId as never, category, details }); setRequestStayId(null); } catch (error) { setRequestError(error instanceof Error ? error.message : "Could not send request."); } finally { setRequestPending(false); } }}>{requestPending ? "Sending..." : "Send request"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
