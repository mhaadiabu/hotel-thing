import { ArrowRight02Icon, BedIcon, RulerIcon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { Route } from "next";

import { RoomImage } from "@/components/room-image";
import { formatGHS } from "@/lib/format";
import { getRoomPresentation, type PublicRoom } from "@/lib/rooms";
import { Badge } from "@hotel/ui/components/badge";
import { Button } from "@hotel/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@hotel/ui/components/card";

export function RoomCard({ room }: { room: PublicRoom }) {
  const details = getRoomPresentation(room);

  return (
    <Card className="group gap-0 overflow-hidden py-0 shadow-sm">
      <RoomImage
        roomName={details.name}
        imageUrls={room.imageUrls}
        className="min-h-64 rounded-none border-0 ring-0"
      />
      <CardHeader className="gap-3 px-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="secondary">{room.type}</Badge>
            <CardTitle className="mt-3 font-heading text-xl font-semibold tracking-tight">
              {details.name}
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="font-heading text-lg font-semibold tabular-nums">
              {formatGHS(room.nightlyRate)}
            </div>
            <div className="text-xs text-muted-foreground">per night</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 px-5 py-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={1.8} />
          {details.capacity} guests
        </span>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={BedIcon} strokeWidth={1.8} />
          {details.bedType}
        </span>
        <span className="flex items-center justify-end gap-1.5">
          <HugeiconsIcon icon={RulerIcon} strokeWidth={1.8} />
          {details.sizeSqm} m²
        </span>
      </CardContent>
      <CardFooter className="px-5 pb-5">
        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={<Link href={`/rooms/${room._id}` as Route} />}
        >
          View room
          <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={1.8} data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  );
}
