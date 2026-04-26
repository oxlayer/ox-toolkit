"use client";

import { cn } from "../../lib/utils";
import { Badge, type BadgeProps } from "../base/badge";

interface BadgeTechProps extends Omit<BadgeProps, "variant"> {
  children: React.ReactNode;
}

export function BadgeTech({ children, className, ...props }: BadgeTechProps) {
  return (
    <Badge
      className={cn(
        "rounded-none border-muted-foreground/30 bg-muted/20 text-[10px] font-mono uppercase tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}
