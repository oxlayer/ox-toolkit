"use client";

import React, { useRef } from "react";
import { cn } from "@oxlayer/shared-ui";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const TechCrosshair = ({ className, size = 24 }: { className?: string; size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={cn("text-muted-foreground/50", className)}
    >
      <line x1="12" y1="0" x2="12" y2="24" />
      <line x1="0" y1="12" x2="24" y2="12" />
    </svg>
  );
};

export const TechCorner = ({
  className,
  position,
}: {
  className?: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) => {
  return (
    <div
      className={cn(
        "absolute w-4 h-4 border-muted-foreground/50",
        position === "top-left" && "top-0 left-0 border-t border-l",
        position === "top-right" && "top-0 right-0 border-t border-r",
        position === "bottom-left" && "bottom-0 left-0 border-b border-l",
        position === "bottom-right" && "bottom-0 right-0 border-b border-r",
        className
      )}
    />
  );
};

export const TechLine = ({ className }: { className?: string }) => {
  return (
    <div className={cn("h-px w-full bg-border relative overflow-hidden", className)}>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
    </div>
  );
};

export const TechDivider = ({
  children,
  action,
  className,
}: {
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-4 py-4 font-mono text-xs uppercase tracking-wider text-muted-foreground",
        className
      )}
    >
      <div className="h-px flex-1 bg-border/50 relative">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-muted-foreground" />
      </div>
      {children && <span>{children}</span>}
      {!children && <span className="text-[10px] opacity-50">{"///"}</span>}
      <div className="h-px flex-1 bg-border/50 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-muted-foreground" />
      </div>
      {action}
    </div>
  );
};

export const TechBarcode = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to(".barcode-bar", {
        height: "random(20%, 30%)",
        duration: 0.5,
        ease: "power1.inOut",
        stagger: {
          each: 0.1,
          from: "random",
          repeat: -1,
          yoyo: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={cn("flex items-end gap-[2px] h-8 opacity-50", className)}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "barcode-bar w-[2px] bg-current",
            i % 3 === 0 ? "h-full" : i % 2 === 0 ? "h-2/3" : "h-1/2"
          )}
        />
      ))}
    </div>
  );
};

export const TechConnector = ({
  direction = "vertical",
  length = "100px",
  className,
}: {
  direction?: "vertical" | "horizontal";
  length?: string;
  className?: string;
}) => {
  const isVertical = direction === "vertical";
  return (
    <div
      className={cn(
        "bg-border/50 relative overflow-hidden",
        isVertical ? "w-px" : "h-px",
        className
      )}
      style={{ [isVertical ? "height" : "width"]: length }}
    >
      <div
        className={cn(
          "absolute bg-muted-foreground",
          isVertical ? "w-full h-4 top-0 animate-shimmer" : "h-full w-4 left-0 animate-shimmer"
        )}
      />
    </div>
  );
};

export const TechVector = ({
  name,
  className,
  style,
  basePath = "/vector/3d-cyberpunk-grid-y2k-wireframe-2024-08-22-19-33-33-utc/best",
}: {
  name: "9" | "11" | "15" | "16" | "18" | "20" | "21" | "25";
  className?: string;
  style?: React.CSSProperties;
  basePath?: string;
}) => {
  return (
    <img
      src={`${basePath}/${name}.svg`}
      alt="Tech Decoration"
      className={cn("pointer-events-none select-none", className)}
      style={style}
    />
  );
};
