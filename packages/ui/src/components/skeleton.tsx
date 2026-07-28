import { cn } from "@hotel/ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("motion-safe:animate-pulse rounded-2xl bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
