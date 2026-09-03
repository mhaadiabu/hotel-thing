"use client";

import { api } from "@hotel/backend/convex/_generated/api";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { useQuery } from "convex/react";

import { PublicHeader } from "@/components/public-header";
import { RoomCard } from "@/components/room-card";

export default function StayPage() {
  const rooms = useQuery(api.rooms.listAvailable);
  return (
    <main id="main-content" className="min-h-[100dvh] bg-background">
      <PublicHeader />
      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase text-muted-foreground">Available rooms</p>
          <h1 className="mt-3 text-balance font-heading text-4xl font-semibold sm:text-5xl">
            Find your room.
          </h1>
          <p className="mt-4 text-pretty leading-7 text-muted-foreground">
            Compare current availability, room details, and nightly rates before booking.
          </p>
        </div>
        {rooms === undefined ? (
          <div className="mt-8 grid gap-6 sm:mt-10 md:grid-cols-2">
            <Skeleton className="h-[420px] sm:h-[500px]" />
            <Skeleton className="h-[420px] sm:h-[500px]" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed p-7 text-center sm:mt-10 sm:p-10">
            <h2 className="text-balance font-heading text-xl font-semibold">
              No rooms are available right now
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for new availability.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:mt-10 md:grid-cols-2">
            {rooms.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
