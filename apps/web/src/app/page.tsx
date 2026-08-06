import { ArrowRight02Icon, BedIcon, Coffee02Icon, Wifi01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@hotel/ui/components/button";
import Link from "next/link";
import type { Route } from "next";

import { PublicHeader } from "@/components/public-header";

const HOTEL_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2200&q=90";

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <PublicHeader />
      <section className="relative min-h-[calc(100svh-4.5rem)] overflow-hidden">
        <img src={HOTEL_IMAGE} alt="Haven Hotel exterior at dusk" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-7xl items-end px-4 pb-16 pt-24 sm:px-6 sm:pb-20 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="text-sm font-medium">Accra, Ghana</p>
            <h1 className="mt-4 font-heading text-5xl font-semibold leading-tight sm:text-7xl">Haven Hotel</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">Comfortable rooms, attentive service, and a straightforward stay from booking to check-out.</p>
            <Button className="mt-8" size="lg" render={<Link href={"/stay" as Route} />}>
              View available rooms
              <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div><p className="text-xs font-medium uppercase text-muted-foreground">Your stay</p><h2 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">Everything you need, without the friction.</h2></div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div><HugeiconsIcon icon={BedIcon} /><h3 className="mt-4 font-medium">Rest well</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Thoughtful rooms with practical details for short visits and longer stays.</p></div>
            <div><HugeiconsIcon icon={Wifi01Icon} /><h3 className="mt-4 font-medium">Stay connected</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Reliable Wi-Fi and simple self-service access to your booking.</p></div>
            <div><HugeiconsIcon icon={Coffee02Icon} /><h3 className="mt-4 font-medium">Ask anytime</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Booked guests can request housekeeping, amenities, or maintenance from their dashboard.</p></div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-medium uppercase text-muted-foreground">Book direct</p><h2 className="mt-3 font-heading text-3xl font-semibold">Choose a room that fits the way you travel.</h2><p className="mt-4 leading-7 text-muted-foreground">See current availability, room details, rates, and photography before you reserve.</p></div><Button variant="outline" render={<Link href={"/stay" as Route} />}>Browse rooms<HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" /></Button></div></section>

      <footer className="border-t py-8"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>Haven Hotel</span><span>Thoughtful rooms. Straightforward booking.</span></div></footer>
    </main>
  );
}
