"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface StaticSlashBarProps {
  className?: string;
  width?: string;
  backgroundColor?: string;
  borderColor?: string;
  patternId?: string;
  size?: number;
  strokeWidth?: number;
  lineClassName?: string;
  angle?: number;
  fade?: "none" | "left" | "right" | "both" | "top" | "bottom";
  direction?: "forward" | "backward";
}

const getMaskStyle = (fade: StaticSlashBarProps["fade"]) => {
  switch (fade) {
    case "left":
      return { maskImage: "linear-gradient(to right, transparent, black 20%)" };
    case "right":
      return { maskImage: "linear-gradient(to left, transparent, black 20%)" };
    case "both":
      return {
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      };
    case "top":
      return { maskImage: "linear-gradient(to bottom, transparent, black 20%)" };
    case "bottom":
      return { maskImage: "linear-gradient(to top, transparent, black 20%)" };
    default:
      return {};
  }
};

export function StaticSlashBar({
  className,
  width = "w-2",
  backgroundColor = "bg-transparent",
  borderColor = "border-transparent",
  patternId,
  size = 4,
  strokeWidth = 2,
  lineClassName = "text-muted-foreground",
  angle = 45,
  fade = "none",
  direction = "forward",
}: StaticSlashBarProps) {
  const uniquePatternId = patternId || `pattern-slash-${React.useId()}`;
  const rotation = direction === "forward" ? angle : -angle;

  return (
    <div
      className={cn(
        "fixed top-0 bottom-0 left-0 flex items-center overflow-hidden z-[60] pointer-events-none",
        width,
        backgroundColor,
        borderColor,
        className
      )}
      style={getMaskStyle(fade)}
    >
      <svg
        className="w-full h-full"
        shapeRendering="geometricPrecision"
        aria-hidden="true"
        role="presentation"
        focusable="false"
      >
        <defs>
          <pattern
            id={uniquePatternId}
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${rotation})`}
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={size}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className={lineClassName}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${uniquePatternId})`} />
      </svg>
    </div>
  );
}
