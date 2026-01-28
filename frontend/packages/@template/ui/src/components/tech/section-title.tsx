"use client";

import { cn } from "@oxlayer/shared-ui";
import { BadgeTech } from "./badge-tech";
import { TechCrosshair } from "./tech-decorations";

interface SectionTitleProps {
  badge?: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  className?: string;
  badgeClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionTitle({
  badge,
  title,
  description,
  className,
  badgeClassName,
  descriptionClassName,
}: SectionTitleProps) {
  return (
    <div className={cn("mb-16 max-w-3xl mx-auto text-center relative", className)}>
      <div className="absolute top-0 left-0 -translate-x-full opacity-20 hidden md:block text-stone-700">
        <TechCrosshair />
      </div>
      <div className="absolute top-0 right-0 translate-x-full opacity-20 hidden md:block text-stone-700">
        <TechCrosshair />
      </div>

      {badge && (
        <div className="flex justify-center mb-6">
          <BadgeTech
            className={cn("bg-stone-900 border-lime-500/30 text-lime-500", badgeClassName)}
          >
            {badge}
          </BadgeTech>
        </div>
      )}
      <h2
        className={cn(
          "text-3xl md:text-5xl font-light text-white tracking-tighter mb-6 uppercase font-nippo",
          className
        )}
      >
        {title}
      </h2>

      <div className="w-24 h-1 bg-lime-500/50 mx-auto mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-lime-400 -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>

      {description && (
        <p
          className={cn(
            "text-stone-400 font-mono text-xs md:text-sm leading-relaxed max-w-2xl mx-auto uppercase tracking-wide",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
