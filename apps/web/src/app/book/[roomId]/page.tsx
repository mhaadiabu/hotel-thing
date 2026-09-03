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
import { useEffect, useRef, useState } from "react";

import { InlineAlert } from "@/components/inline-alert";
import { PublicHeader } from "@/components/public-header";
import { RoomImage } from "@/components/room-image";
import { getAppError, type AppErrorCode } from "@/lib/app-error";
import { formatGHS } from "@/lib/format";
import { calculateNights, getRoomPresentation } from "@/lib/rooms";

type BookingIssue = {
  code: AppErrorCode | null;
  title: string;
  message: string;
};

const BOOKING_ERROR_TITLES: Partial<Record<AppErrorCode, string>> = {
  CHECK_IN_IN_PAST: "Choose a new check-in date",
  DATES_UNAVAILABLE: "Those dates were just booked",
  INVALID_DATES: "Check your stay dates",
  INVALID_GUEST_COUNT: "Check the guest count",
  ROOM_UNAVAILABLE: "This room is no longer available",
  UNAUTHENTICATED: "Sign in again to continue",
};

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
  const [error, setError] = useState<BookingIssue | null>(null);
  const checkInRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const nights = calculateNights(form.checkIn, form.checkOut);
  const availability = useQuery(
    api.reservations.checkAvailability,
    room && nights > 0
      ? { roomId: room._id, checkIn: form.checkIn, checkOut: form.checkOut }
      : "skip",
  );

  if (!isLoaded || room === undefined) {
    return (
      <main id="main-content" className="min-h-[100dvh]">
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
      <main id="main-content" className="min-h-[100dvh]">
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
      <main id="main-content" className="min-h-[100dvh]">
        <PublicHeader />
        <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center px-4 text-center">
          <h1 className="font-heading text-3xl font-semibold">This room is no longer available</h1>
          <Button className="mt-6" nativeButton={false} render={<Link href={"/stay" as Route} />}>
            Browse rooms
          </Button>
        </div>
      </main>
    );
  }

  const details = getRoomPresentation(room);
  const total = nights * room.nightlyRate;
  const datesUnavailable = availability?.available === false;

  function showIssue(title: string, message: string, code: AppErrorCode | null = null) {
    setError({ title, message, code });
  }

  async function handleBook() {
    if (!room) return;

    setError(null);
    const guestCount = Number(form.guestCount);
    if (nights < 1) {
      showIssue("Check your stay dates", "Choose a check-out date after your check-in date.");
      checkInRef.current?.focus();
      return;
    }
    if (datesUnavailable) {
      showIssue(
        "Those dates are unavailable",
        "Choose different check-in and check-out dates to continue.",
        "DATES_UNAVAILABLE",
      );
      checkInRef.current?.focus();
      return;
    }
    if (paymentMethod === "card" && !payment.cardNumber.trim()) {
      showIssue("Add your card details", "Enter a card number to continue.");
      return;
    }
    if (paymentMethod === "mobile_money" && !payment.phone.trim()) {
      showIssue(
        "Add your mobile money number",
        "Enter the number linked to your mobile money account.",
      );
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > details.capacity) {
      showIssue("Check the guest count", `Choose between 1 and ${details.capacity} guests.`);
      return;
    }
    setPending(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      await createReservation({
        roomId: room._id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guestCount,
        paymentMethod,
      });
      router.push("/guest?booked=1");
    } catch (bookingError) {
      const issue = getAppError(
        bookingError,
        "Your payment was not charged. Check your connection and try again.",
      );
      setError({
        ...issue,
        title: issue.code
          ? (BOOKING_ERROR_TITLES[issue.code] ?? "We could not complete your booking")
          : "We could not complete your booking",
      });
      if (
        issue.code === "DATES_UNAVAILABLE" ||
        issue.code === "INVALID_DATES" ||
        issue.code === "CHECK_IN_IN_PAST"
      ) {
        checkInRef.current?.focus();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main id="main-content" className="min-h-[100dvh] bg-background">
      <PublicHeader />
      <section className="mx-auto grid max-w-5xl gap-6 pb-0 sm:px-6 sm:py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:px-8 lg:py-16">
        <div className="px-4 pt-6 sm:px-0 sm:pt-0">
          <RoomImage
            roomName={details.name}
            imageUrls={room.imageUrls}
            className="min-h-[240px] sm:min-h-[360px]"
          />
          <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
            {details.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Room {room.roomNumber} · {details.bedType} · up to {details.capacity} guests
          </p>
        </div>

        <Card className="rounded-none shadow-none ring-0 [--card-spacing:--spacing(4)] sm:rounded-xl sm:shadow-sm sm:ring-1 sm:[--card-spacing:--spacing(6)]">
          <CardHeader className="px-4 sm:px-(--card-spacing)">
            <CardTitle className="font-heading text-2xl font-semibold">Reserve your stay</CardTitle>
          </CardHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleBook();
            }}
          >
            <CardContent className="flex flex-col gap-5 px-4 sm:gap-6 sm:px-(--card-spacing)">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkIn">Check-in</Label>
                  <Input
                    ref={checkInRef}
                    id="checkIn"
                    name="checkIn"
                    type="date"
                    min={today}
                    disabled={pending}
                    aria-invalid={
                      error?.code === "DATES_UNAVAILABLE" ||
                      error?.code === "INVALID_DATES" ||
                      error?.code === "CHECK_IN_IN_PAST" ||
                      datesUnavailable
                    }
                    value={form.checkIn}
                    onChange={(event) => {
                      const checkIn = event.target.value;
                      setError(null);
                      setForm((current) => ({
                        ...current,
                        checkIn,
                        checkOut:
                          current.checkOut && current.checkOut <= checkIn ? "" : current.checkOut,
                      }));
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkOut">Check-out</Label>
                  <Input
                    id="checkOut"
                    name="checkOut"
                    type="date"
                    min={form.checkIn || today}
                    disabled={pending}
                    aria-invalid={
                      error?.code === "DATES_UNAVAILABLE" ||
                      error?.code === "INVALID_DATES" ||
                      datesUnavailable
                    }
                    value={form.checkOut}
                    onChange={(event) => {
                      setError(null);
                      setForm((current) => ({ ...current, checkOut: event.target.value }));
                    }}
                  />
                </div>
              </div>
              {datesUnavailable && error?.code !== "DATES_UNAVAILABLE" ? (
                <InlineAlert
                  title="Those dates are unavailable"
                  description="Another guest has already reserved this room for part of that stay. Choose different dates."
                />
              ) : null}
              <div className="flex flex-col gap-2">
                <Label htmlFor="guestCount">Guests</Label>
                <Input
                  id="guestCount"
                  name="guestCount"
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

              <div className="rounded-xl bg-muted p-4 sm:p-5">
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

              <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
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
                    className="flex min-h-12 min-w-0 items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary/5"
                  >
                    <CreditCard className="size-4" aria-hidden="true" />
                    Card
                  </button>
                  <button
                    type="button"
                    aria-pressed={paymentMethod === "mobile_money"}
                    disabled={pending}
                    onClick={() => setPaymentMethod("mobile_money")}
                    className="flex min-h-12 min-w-0 items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary/5"
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
                        name="cardNumber"
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
                        name="expiry"
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
                        name="cvc"
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
                      name="mobileMoney"
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

              {error ? (
                <InlineAlert
                  title={error.title}
                  description={error.message}
                  action={
                    error.code === "ROOM_UNAVAILABLE" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={"/stay" as Route} />}
                      >
                        Browse available rooms
                      </Button>
                    ) : undefined
                  }
                />
              ) : null}
              <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/70 bg-card/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <Button
                  type="submit"
                  size="lg"
                  className="min-h-11 w-full"
                  disabled={pending || datesUnavailable}
                >
                  {pending
                    ? "Processing payment…"
                    : datesUnavailable
                      ? "Choose new dates"
                      : `Pay ${formatGHS(total)}`}
                </Button>
              </div>
            </CardContent>
          </form>
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
