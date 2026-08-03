"use client";

import { useAuth } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import type { Id } from "@hotel/backend/convex/_generated/dataModel";
import { Button } from "@hotel/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@hotel/ui/components/card";
import { Input } from "@hotel/ui/components/input";
import { Label } from "@hotel/ui/components/label";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PublicHeader } from "@/components/public-header";
import { RoomImagePlaceholder } from "@/components/room-image-placeholder";
import { formatGHS } from "@/lib/format";
import { calculateNights, getRoomPresentation } from "@/lib/rooms";

export default function BookingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId as Id<"rooms">;
  const room = useQuery(api.rooms.getAvailable, { roomId });
  const createReservation = useMutation(api.reservations.create);
  const router = useRouter();
  const [form, setForm] = useState({ checkIn: "", checkOut: "", guestCount: "1" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded || room === undefined) {
    return (
      <main className="min-h-[100dvh]">
        <PublicHeader />
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-2">
          <Skeleton className="h-[480px] rounded-3xl" />
          <Skeleton className="h-[480px] rounded-3xl" />
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    const redirectUrl = `/book/${roomId}`;
    return (
      <main className="min-h-[100dvh]">
        <PublicHeader />
        <SignInRedirect redirectUrl={redirectUrl} />
        <div className="mx-auto flex min-h-[70dvh] max-w-lg items-center justify-center px-4 text-center text-sm text-muted-foreground">
          Taking you to sign in so you can finish your booking.
        </div>
      </main>
    );
  }

  if (room === null) {
    return (
      <main className="min-h-[100dvh]">
        <PublicHeader />
        <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center px-4 text-center">
          <h1 className="font-heading text-3xl font-semibold">This room is no longer available</h1>
          <Button className="mt-6" render={<Link href="/#rooms" />}>
            Browse rooms
          </Button>
        </div>
      </main>
    );
  }

  const details = getRoomPresentation(room);
  const nights = calculateNights(form.checkIn, form.checkOut);
  const total = nights * room.nightlyRate;

  async function handleBook() {
    setError(null);
    const guestCount = Number(form.guestCount);
    if (nights < 1) {
      setError("Choose a check-out date after your check-in date.");
      return;
    }
    setPending(true);
    try {
      await createReservation({
        roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guestCount,
      });
      router.push("/guest?booked=1");
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : "The booking could not be completed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background">
      <PublicHeader />
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        <div>
          <RoomImagePlaceholder roomName={details.name} className="min-h-[360px]" />
          <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
            {details.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Room {room.roomNumber} · {details.bedType} · up to {details.capacity} guests
          </p>
        </div>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-2xl font-semibold">Reserve your stay</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkIn">Check-in</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={form.checkIn}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, checkIn: event.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkOut">Check-out</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={form.checkOut}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, checkOut: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guestCount">Guests</Label>
              <Input
                id="guestCount"
                type="number"
                min="1"
                max={details.capacity}
                value={form.guestCount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, guestCount: event.target.value }))
                }
              />
            </div>

            <div className="rounded-3xl bg-muted p-5">
              <div className="flex justify-between text-sm">
                <span>
                  {formatGHS(room.nightlyRate)} × {nights || 0} nights
                </span>
                <span className="tabular-nums">{formatGHS(total)}</span>
              </div>
              <div className="mt-4 flex justify-between border-t pt-4 font-heading text-lg font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatGHS(total)}</span>
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button size="lg" disabled={pending} onClick={() => void handleBook()}>
              {pending ? "Confirming booking" : "Confirm booking"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function SignInRedirect({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}` as Route);
  }, [redirectUrl, router]);

  return null;
}
