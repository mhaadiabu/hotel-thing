"use client";

import { ArrowDown02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { api } from "@hotel/backend/convex/_generated/api";
import { Button } from "@hotel/ui/components/button";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { useQuery } from "convex/react";
import Link from "next/link";

import { PublicHeader } from "@/components/public-header";
import { RoomCard } from "@/components/room-card";
import { RoomImagePlaceholder } from "@/components/room-image-placeholder";

export default function Home() {
  const rooms = useQuery(api.rooms.listAvailable);

  return (
    <main className="min-h-[100dvh] bg-background">
      <PublicHeader />
      <section className="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-14">
        <div className="flex max-w-xl flex-col items-start gap-7">
          <p className="text-sm font-medium text-muted-foreground">
            Stay comfortably. Book simply.
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl">
            Your room is ready when you are.
          </h1>
          <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Browse available rooms, compare the details that matter, and reserve your stay in a few
            steps.
          </p>
          <Button size="lg" render={<Link href="/#rooms" />}>
            Explore rooms
            <HugeiconsIcon icon={ArrowDown02Icon} strokeWidth={1.8} data-icon="inline-end" />
          </Button>
        </div>
        <RoomImagePlaceholder
          roomName="Haven Hotel featured room"
          className="min-h-[420px] lg:min-h-[560px]"
        />
      </section>

      <section id="rooms" className="scroll-mt-24 border-t border-border/70 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">Available now</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Find the room that fits your stay.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Every room below is currently open for booking. Full details are available without
              signing in.
            </p>
          </div>

          {rooms === undefined ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[500px] rounded-3xl" />
              <Skeleton className="h-[500px] rounded-3xl" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed p-10 text-center">
              <h3 className="font-heading text-xl font-semibold">
                No rooms are available right now
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon. New availability will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Haven Hotel</span>
          <span>Thoughtful rooms. Straightforward booking.</span>
        </div>
      </footer>
    </main>
  );
}
