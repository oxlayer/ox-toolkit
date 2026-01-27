"use client";

import { cn } from "../../lib/utils";
import React from "react";

export type PatternType = "dots" | "grid";

export interface BlockPatternProps {
  type?: PatternType;
  opacity?: number;
  size?: number;
  showNoise?: boolean;
  className?: string;
}

export function BlockPattern({
  type = "grid",
  opacity,
  size,
  showNoise = true,
  className,
}: BlockPatternProps) {
  const defaultOpacity = type === "dots" ? 0.3 : undefined;
  const defaultSize = type === "dots" ? 12 : 24;
  const finalOpacity = opacity ?? defaultOpacity;
  const finalSize = size ?? defaultSize;

  const patternStyle: React.CSSProperties =
    type === "dots"
      ? {
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(87, 83, 78, 0.3) 1px, transparent 0)",
          backgroundSize: `${finalSize}px ${finalSize}px`,
          ...(finalOpacity !== undefined && { opacity: finalOpacity }),
        }
      : {
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: `${finalSize}px ${finalSize}px`,
          ...(finalOpacity !== undefined && { opacity: finalOpacity }),
        };

  return (
    <>
      {showNoise && (
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 overflow-hidden"></div>
      )}
      <div className={cn("absolute inset-0 overflow-hidden", className)} style={patternStyle}></div>
    </>
  );
}
