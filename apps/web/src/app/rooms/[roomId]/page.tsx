"use client";

import {
  ArrowLeft02Icon,
  BedIcon,
  CheckmarkCircle02Icon,
  RulerIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { api } from "@hotel/backend/convex/_generated/api";
import type { Id } from "@hotel/backend/convex/_generated/dataModel";
import { Badge } from "@hotel/ui/components/badge";
import { Button } from "@hotel/ui/components/button";
import { Skeleton } from "@hotel/ui/components/skeleton";
import { useQuery } from "convex/react";
import Link from "next/link";
import type { Route } from "next";
import { useParams } from "next/navigation";

import { PublicHeader } from "@/components/public-header";
import { RoomImagePlaceholder } from "@/components/room-image-placeholder";
import { formatGHS } from "@/lib/format";
import { getRoomPresentation } from "@/lib/rooms";

export default function RoomDetailsPage() {
  const params = useParams<{ roomId: string }>();
  const room = useQuery(api.rooms.getAvailable, {
    roomId: params.roomId as Id<"rooms">,
  });

  return (
    <main className="min-h-[100dvh] bg-background">
      <PublicHeader />
      {room === undefined ? (
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8">
          <Skeleton className="min-h-[560px] rounded-3xl" />
          <Skeleton className="min-h-[420px] rounded-3xl" />
        </div>
      ) : room === null ? (
        <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-4 text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            This room is not available
          </h1>
          <p className="mt-3 text-muted-foreground">
            It may have been booked or taken offline. Browse the rooms currently open for stays.
          </p>
          <Button className="mt-7" render={<Link href="/#rooms" />}>
            Browse available rooms
          </Button>
        </div>
      ) : (
        <RoomDetails room={room} />
      )}
    </main>
  );
}

function RoomDetails({
  room,
}: {
  room: NonNullable<ReturnType<typeof useQuery<typeof api.rooms.getAvailable>>>;
}) {
  const details = getRoomPresentation(room);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <Button variant="ghost" render={<Link href="/#rooms" />}>
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={1.8} data-icon="inline-start" />
          All rooms
        </Button>
      </div>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <RoomImagePlaceholder
            roomName={details.name}
            className="min-h-[420px] sm:col-span-2 lg:min-h-[520px]"
          />
          <RoomImagePlaceholder roomName={`${details.name} bathroom`} className="min-h-52" />
          <RoomImagePlaceholder roomName={`${details.name} view`} className="min-h-52" />
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Badge variant="secondary">{room.type}</Badge>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight tracking-[-0.035em]">
            {details.name}
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">{details.description}</p>

          <div className="mt-7 grid grid-cols-3 gap-3 rounded-3xl bg-muted p-5 text-sm">
            <span className="flex flex-col gap-2">
              <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={1.8} />
              {details.capacity} guests
            </span>
            <span className="flex flex-col gap-2">
              <HugeiconsIcon icon={BedIcon} strokeWidth={1.8} />
              {details.bedType}
            </span>
            <span className="flex flex-col gap-2">
              <HugeiconsIcon icon={RulerIcon} strokeWidth={1.8} />
              {details.sizeSqm} m²
            </span>
          </div>

          <div className="mt-8">
            <h2 className="font-heading text-lg font-semibold">Included in your stay</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
              {details.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-2">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} />
                  {amenity}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-9 flex items-end justify-between gap-6 border-t pt-6">
            <div>
              <div className="font-heading text-2xl font-semibold tabular-nums">
                {formatGHS(room.nightlyRate)}
              </div>
              <div className="text-sm text-muted-foreground">per night</div>
            </div>
            <Button size="lg" render={<Link href={`/book/${room._id}` as Route} />}>
              Book this room
            </Button>
          </div>
        </aside>
      </section>
    </>
  );
}
