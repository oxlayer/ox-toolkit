"use client";

import { useEffect, useRef, useState } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const progressTech = tv({
  slots: {
    container: "flex w-full items-center justify-start",
    segment: "h-full transition-all duration-300",
  },
  variants: {
    size: {
      sm: { container: "h-3" },
      md: { container: "h-4" },
      lg: { container: "h-5" },
    },
    variant: {
      default: { segment: "bg-primary shadow-[0_0_2px_rgba(var(--primary),0.3)]" },
      warning: { segment: "bg-warning shadow-[0_0_2px_rgba(var(--warning),0.3)]" },
      success: { segment: "bg-emerald-500 shadow-[0_0_2px_rgba(16,185,129,0.3)]" },
      muted: { segment: "bg-muted-foreground" },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

type ProgressTechVariants = VariantProps<typeof progressTech>;

export interface ProgressTechProps extends ProgressTechVariants {
  value: number;
  max?: number;
  /**
   * Total number of visual segments to render.
   * If not provided, defaults to `max` if `max <= 40`, otherwise 20.
   */
  totalSegments?: number;
  className?: string;
}

export function ProgressTech({
  value,
  max = 100,
  className,
  variant = "default",
  size = "md",
  totalSegments,
}: ProgressTechProps) {
  const styles = progressTech({ variant, size });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Default to max segments if small (<= 40), otherwise condense to 20 for a cleaner look
  // unless totalSegments is explicitly provided.
  const visualSegments = totalSegments ?? (max <= 40 ? max : 20);

  // Constants
  const GAP_PX = 2; // Fixed integer gap for perfect spacing

  // Calculate widths using distributed error (Bresenham-like) algorithm
  // This ensures:
  // 1. Total width matches exactly (no space in corners)
  // 2. Gaps are always exactly GAP_PX
  // 3. Bar widths differ by at most 1px, distributed evenly
  const totalGapWidth = Math.max(0, visualSegments - 1) * GAP_PX;
  const availableWidth = Math.max(0, containerWidth - totalGapWidth);

  // Pre-calculate all segment widths
  const segmentWidths = Array.from({ length: visualSegments }, (_, i) => {
    if (containerWidth === 0) return 0;

    // Calculate cumulative target width at i and i+1
    // The width of segment i is the difference between these integers
    const start = Math.floor((availableWidth * i) / visualSegments);
    const end = Math.floor((availableWidth * (i + 1)) / visualSegments);
    return end - start;
  });

  // Calculate fill percentage
  const safeMax = Math.max(max, 1);
  const percentage = Math.min(Math.max(value, 0), safeMax) / safeMax;

  // Calculate filled segments count
  const filledCount = Math.round(percentage * visualSegments);

  // Determine empty segment color based on variant
  const getEmptyColor = () => {
    switch (variant) {
      case "default":
        return "bg-primary/20";
      case "warning":
        return "bg-warning/20";
      case "success":
        return "bg-emerald-500/20";
      case "muted":
        return "bg-muted-foreground/20";
      default:
        return "bg-primary/20";
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.container({ className })}
      style={{ gap: `${GAP_PX}px` }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {segmentWidths.map((width, i) => {
        const isFilled = i < filledCount;
        return (
          <div
            key={i}
            className={
              isFilled
                ? styles.segment()
                : `h-full rounded-[2px] transition-all duration-300 ${getEmptyColor()}`
            }
            style={{
              width: width > 0 ? `${width}px` : undefined,
              flex: width > 0 ? "none" : "1", // Fallback to flex-1 if width calc is pending
            }}
          />
        );
      })}
    </div>
  );
}
