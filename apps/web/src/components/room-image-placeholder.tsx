import { Image01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@hotel/ui/lib/utils";

export function RoomImagePlaceholder({
  roomName,
  className,
}: {
  roomName: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-64 items-end overflow-hidden rounded-3xl bg-muted p-5 text-muted-foreground ring-1 ring-border",
        className,
      )}
      role="img"
      aria-label={`Photography placeholder for ${roomName}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,color-mix(in_oklch,var(--border),transparent_28%)_49%,transparent_50%),linear-gradient(45deg,transparent_0%,transparent_48%,color-mix(in_oklch,var(--border),transparent_28%)_49%,transparent_50%)] bg-[size:48px_48px] opacity-60" />
      <div className="relative flex items-center gap-2 rounded-full bg-background/85 px-3 py-2 text-xs font-medium text-foreground backdrop-blur-sm">
        <HugeiconsIcon icon={Image01Icon} strokeWidth={1.8} />
        Room photography
      </div>
    </div>
  );
}
