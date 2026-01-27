import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { ChevronDownIcon, ChevronUpIcon, MinusIcon, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export type PillProps = ComponentProps<typeof Badge>;

export const Pill = ({ variant = "secondary", className, ...props }: PillProps) => (
  <Badge
    className={cn("gap-2 rounded-full px-3 py-1.5 font-normal", className)}
    variant={variant}
    {...props}
  />
);

export type PillAvatarProps = ComponentProps<typeof AvatarImage> & {
  fallback?: string;
};

export const PillAvatar = ({ fallback, className, ...props }: PillAvatarProps) => (
  <Avatar className={cn("-ml-1 h-4 w-4", className)}>
    <AvatarImage {...props} />
    <AvatarFallback>{fallback}</AvatarFallback>
  </Avatar>
);

export type PillButtonProps = ComponentProps<typeof Button>;

export const PillButton = ({ className, ...props }: PillButtonProps) => (
  <Button
    className={cn("-my-2 -mr-2 size-6 rounded-full p-0.5 hover:bg-foreground/5", className)}
    size="icon"
    variant="ghost"
    {...props}
  />
);

export type PillStatusProps = {
  children: ReactNode;
  className?: string;
};

export const PillStatus = ({ children, className, ...props }: PillStatusProps) => (
  <div className={cn("flex items-center gap-2 border-r pr-2 font-medium", className)} {...props}>
    {children}
  </div>
);

export type PillIndicatorProps = {
  variant?: "success" | "error" | "warning" | "info";
  pulse?: boolean;
  className?: string;
  label?: string;
};

export const PillIndicator = ({
  variant = "success",
  pulse = false,
  className,
  label,
  ...props
}: PillIndicatorProps) => (
  <span
    className={cn("relative flex size-2", className)}
    role="status"
    aria-label={label ?? variant}
    {...props}
  >
    {pulse && (
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
          variant === "success" && "bg-success/75",
          variant === "error" && "bg-destructive/75",
          variant === "warning" && "bg-warning/75",
          variant === "info" && "bg-info/75"
        )}
      />
    )}
    <span
      className={cn(
        "relative inline-flex size-2 rounded-full",
        variant === "success" && "bg-success",
        variant === "error" && "bg-destructive",
        variant === "warning" && "bg-warning",
        variant === "info" && "bg-info"
      )}
    />
  </span>
);

export type PillDeltaProps = {
  className?: string;
  delta: number;
};

export const PillDelta = ({ className, delta }: PillDeltaProps) => {
  const ariaLabel =
    delta === 0
      ? "no change"
      : delta > 0
        ? `increased by ${delta}`
        : `decreased by ${Math.abs(delta)}`;
  if (!delta) {
    return (
      <MinusIcon className={cn("size-3 text-muted-foreground", className)} aria-label={ariaLabel} />
    );
  }
  if (delta > 0) {
    return (
      <ChevronUpIcon className={cn("size-3 text-success", className)} aria-label={ariaLabel} />
    );
  }
  return (
    <ChevronDownIcon className={cn("size-3 text-destructive", className)} aria-label={ariaLabel} />
  );
};

export type PillIconProps = {
  icon: LucideIcon;
  className?: string;
};

export const PillIcon = ({ icon: Icon, className, ...props }: PillIconProps) => (
  <Icon className={cn("size-3 text-muted-foreground", className)} size={12} {...props} />
);

export type PillAvatarGroupProps = {
  children: ReactNode;
  className?: string;
};

export const PillAvatarGroup = ({ children, className, ...props }: PillAvatarGroupProps) => (
  <div
    className={cn(
      "flex items-center -space-x-1",
      "[&>*:not(:first-of-type)]:mask-[radial-gradient(circle_9px_at_-4px_50%,transparent_99%,white_100%)]",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
