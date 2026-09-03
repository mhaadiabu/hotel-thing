import type { ReactNode } from "react";

import { cn } from "@hotel/ui/lib/utils";

export function InlineAlert({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-xl border border-destructive/20 bg-destructive/7 px-4 py-3 text-sm text-foreground",
        className,
      )}
    >
      <p className="font-medium text-destructive">{title}</p>
      {description ? <p className="mt-1 text-pretty text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
