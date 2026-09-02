"use client";

import { useAuth } from "@clerk/nextjs";
import { api } from "@hotel/backend/convex/_generated/api";
import { Button } from "@hotel/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@hotel/ui/components/card";
import { Input } from "@hotel/ui/components/input";
import { Label } from "@hotel/ui/components/label";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { useMutation, useQuery } from "convex/react";
import { CreditCard, LockKeyhole, Smartphone } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PublicHeader } from "@/components/public-header";
import { RoomImage } from "@/components/room-image";
import { formatGHS } from "@/lib/format";
import { calculateNights, getRoomPresentation } from "@/lib/rooms";

export default function BookingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const room = useQuery(api.rooms.getAvailable, { roomId });
  const createReservation = useMutation(api.reservations.create);
  const router = useRouter();
  const [form, setForm] = useState({ checkIn: "", checkOut: "", guestCount: "1" });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile_money">("card");
  const [payment, setPayment] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    phone: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  if (!isLoaded || room === undefined) {
    return (
      <main className="min-h-[100dvh]">
        <PublicHeader />
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-2">
          <Skeleton className="h-[480px]" />
          <Skeleton className="h-[480px]" />
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
          <Button className="mt-6" render={<Link href={"/stay" as Route} />}>
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
    if (paymentMethod === "card" && !payment.cardNumber.trim()) {
      setError("Enter a card number to continue.");
      return;
    }
    if (paymentMethod === "mobile_money" && !payment.phone.trim()) {
      setError("Enter the number linked to your mobile money account.");
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > details.capacity) {
      setError(`Choose between 1 and ${details.capacity} guests.`);
      return;
    }
    setPending(true);
    try {
      // A brief delay makes the mocked checkout feel like a real authorization step.
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      await createReservation({
        roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guestCount,
        paymentMethod,
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
          <RoomImage roomName={details.name} imageUrls={room.imageUrls} className="min-h-[360px]" />
          <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
            {details.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Room {room.roomNumber} · {details.bedType} · up to {details.capacity} guests
          </p>
        </div>

        <Card className="shadow-sm">
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
                  min={today}
                  disabled={pending}
                  value={form.checkIn}
                  onChange={(event) => {
                    const checkIn = event.target.value;
                    setForm((current) => ({
                      ...current,
                      checkIn,
                      checkOut: current.checkOut && current.checkOut <= checkIn ? "" : current.checkOut,
                    }));
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkOut">Check-out</Label>
                <Input
                  id="checkOut"
                  type="date"
                  min={form.checkIn || today}
                  disabled={pending}
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
                disabled={pending}
                value={form.guestCount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, guestCount: event.target.value }))
                }
              />
            </div>

            <div className="rounded-xl bg-muted p-5">
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

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-lg font-semibold">Payment</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Demo checkout. Your payment details are never sent or stored.
                  </p>
                </div>
                <LockKeyhole
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={paymentMethod === "card"}
                  disabled={pending}
                  onClick={() => setPaymentMethod("card")}
                  className="flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary/5"
                >
                  <CreditCard className="size-4" aria-hidden="true" />
                  Card
                </button>
                <button
                  type="button"
                  aria-pressed={paymentMethod === "mobile_money"}
                  disabled={pending}
                  onClick={() => setPaymentMethod("mobile_money")}
                  className="flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary/5"
                >
                  <Smartphone className="size-4" aria-hidden="true" />
                  Mobile money
                </button>
              </div>

              {paymentMethod === "card" ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="cardNumber">Card number</Label>
                    <Input
                      id="cardNumber"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      disabled={pending}
                      value={payment.cardNumber}
                      onChange={(event) =>
                        setPayment((current) => ({ ...current, cardNumber: event.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM / YY"
                      disabled={pending}
                      value={payment.expiry}
                      onChange={(event) =>
                        setPayment((current) => ({ ...current, expiry: event.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      disabled={pending}
                      value={payment.cvc}
                      onChange={(event) =>
                        setPayment((current) => ({ ...current, cvc: event.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  <Label htmlFor="mobileMoney">Mobile money number</Label>
                  <Input
                    id="mobileMoney"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="024 123 4567"
                    disabled={pending}
                    value={payment.phone}
                    onChange={(event) =>
                      setPayment((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    We will simulate the approval on the next step.
                  </p>
                </div>
              )}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button size="lg" disabled={pending} onClick={() => void handleBook()}>
              {pending ? "Processing payment" : `Pay ${formatGHS(total)}`}
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
