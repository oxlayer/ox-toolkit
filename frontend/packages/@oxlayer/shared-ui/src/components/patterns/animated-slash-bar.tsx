"use client";

import { cn } from "../../lib/utils";
import React from "react";

export interface AnimatedSlashBarProps {
  className?: string;
  height?: string;
  backgroundColor?: string;
  borderColor?: string;
  patternId?: string;
}

export function AnimatedSlashBar({
  className,
  height = "h-2",
  backgroundColor = "bg-lime-500",
  borderColor = "border-stone-800",
  patternId,
}: AnimatedSlashBarProps) {
  const uniquePatternId = patternId || `pattern-slash-${React.useId()}`;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 flex items-center overflow-hidden z-[60]",
        height,
        backgroundColor,
        borderColor,
        className
      )}
    >
      <svg className="w-full h-full">
        <defs>
          <pattern
            id={uniquePatternId}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <animate attributeName="x" from="0" to="10" dur="1s" repeatCount="indefinite" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
              className="text-stone-950"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${uniquePatternId})`} />
      </svg>
    </div>
  );
}
