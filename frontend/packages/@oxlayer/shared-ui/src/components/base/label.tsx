import type * as React from "react";

import { cn } from "../../lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs/relaxed text-secondary-foreground/50",
        className
      )}
      data-slot="label"
      {...props}
    />
  );
}

export { Label };
