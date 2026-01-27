"use client";

import { cn } from "@oxlayer/shared-ui/lib";
import { StaticSlashBar } from "@oxlayer/shared-ui/components/patterns/static-slash-bar";

export interface TechStepHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function TechStepHeader({ title, description, className }: TechStepHeaderProps) {
  return (
    <div className={cn("relative mb-2 pb-4", className)}>
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="h-6 w-1 bg-primary/80 shrink-0 mt-2" />
          <div className="space-y-1">
            <h3 className="text-2xl text-muted-foreground uppercase tracking-tight font-nippo leading-none pt-1">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground/60 max-w-[80%]">{description}</p>
            )}
          </div>
        </div>
        <div className="h-6 w-32 relative opacity-50 shrink-0 mt-1">
          <StaticSlashBar
            width="w-full"
            size={4}
            strokeWidth={3}
            lineClassName="text-muted-foreground/40"
            angle={45}
            className="!absolute !inset-0"
            patternId={`tech-header-${title.replace(/\s+/g, "-").toLowerCase()}`}
          />
        </div>
      </div>
    </div>
  );
}
