import Image from "next/image";

import { RoomImagePlaceholder } from "@/components/room-image-placeholder";
import { cn } from "@hotel/ui/lib/utils";

export function RoomImage({
  roomName,
  imageUrls,
  index = 0,
  className,
}: {
  roomName: string;
  imageUrls?: string[];
  index?: number;
  className?: string;
}) {
  const src = imageUrls?.[index];
  if (!src) return <RoomImagePlaceholder roomName={roomName} className={className} />;

  return (
    <div className={cn("relative min-h-64 overflow-hidden rounded-lg bg-muted", className)}>
      <Image
        src={src}
        alt={`${roomName}${index > 0 ? ` photo ${index + 1}` : ""}`}
        fill
        unoptimized
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
