"use client";

import React from "react";
import { motion } from "motion/react";
import { cn, type CornerPosition } from "@oxlayer/shared-ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  CardToolbar,
} from "@oxlayer/shared-ui";
import { CornerFiducials } from "@oxlayer/shared-ui";

const transition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };
const CORNER_SIZE = "12px";
const CORNER_SIZE_HOVER = "20px";

const MotionCard = motion.create(Card);
type MotionCardStyle = React.ComponentProps<typeof MotionCard>["style"];

function AnimatedTechlineCorners() {
  return (
    <>
      {/* Top Left */}
      <motion.div
        initial={{ opacity: 0.3, height: CORNER_SIZE }}
        variants={{ hover: { opacity: 1, height: CORNER_SIZE_HOVER } }}
        transition={transition}
        style={{ height: CORNER_SIZE }}
        className="absolute -left-px -top-px w-px bg-foreground"
      />
      <motion.div
        initial={{ opacity: 0.3, width: CORNER_SIZE }}
        variants={{ hover: { opacity: 1, width: CORNER_SIZE_HOVER } }}
        transition={transition}
        style={{ width: CORNER_SIZE }}
        className="absolute -left-px -top-px h-px bg-foreground"
      />
      {/* Top Right */}
      <motion.div
        initial={{ opacity: 0.3, height: CORNER_SIZE }}
        variants={{ hover: { opacity: 1, height: CORNER_SIZE_HOVER } }}
        transition={transition}
        style={{ height: CORNER_SIZE }}
        className="absolute -right-px -top-px w-px bg-foreground"
      />
      <motion.div
        initial={{ opacity: 0.3, width: CORNER_SIZE }}
        variants={{ hover: { opacity: 1, width: CORNER_SIZE_HOVER } }}
        transition={transition}
        style={{ width: CORNER_SIZE }}
        className="absolute -right-px -top-px h-px bg-foreground"
      />
      {/* Bottom Left */}
      <motion.div
        initial={{ opacity: 0.3, height: CORNER_SIZE }}
        variants={{ hover: { opacity: 1, height: CORNER_SIZE_HOVER } }}
        transition={transition}
        style={{ height: CORNER_SIZE }}
        className="absolute -left-px -bottom-px w-px bg-foreground"
      />
      <motion.div
        initial={{ opacity: 0.3, width: CORNER_SIZE }}
        variants={{ hover: { opacity: 1, width: CORNER_SIZE_HOVER } }}
        transition={transition}
        style={{ width: CORNER_SIZE }}
        className="absolute -left-px -bottom-px h-px bg-foreground"
      />
      {/* Bottom Right */}
      <motion.div
        initial={{ opacity: 0.3, height: CORNER_SIZE }}
        variants={{ hover: { opacity: 1, height: CORNER_SIZE_HOVER } }}
        transition={transition}
        style={{ height: CORNER_SIZE }}
        className="absolute -right-px -bottom-px w-px bg-foreground"
      />
      <motion.div
        initial={{ opacity: 0.3, width: CORNER_SIZE }}
        variants={{ hover: { opacity: 1, width: CORNER_SIZE_HOVER } }}
        transition={transition}
        style={{ width: CORNER_SIZE }}
        className="absolute -right-px -bottom-px h-px bg-foreground"
      />
    </>
  );
}

interface CardTechProps {
  children: React.ReactNode;
  className?: string;
  corners?: CornerPosition[];
  corner?: "fiducials" | "techline";
  style?: MotionCardStyle;
}

function CardTechRoot({
  children,
  className,
  corners,
  corner = "fiducials",
  style,
}: CardTechProps) {
  return (
    <MotionCard
      initial="initial"
      whileHover="hover"
      className={cn(
        "group rounded-none transition-colors duration-300 bg-card",
        corner === "techline" && "",
        className
      )}
      {...(style !== undefined ? { style } : {})}
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
      {corner === "fiducials" ? (
        <CornerFiducials {...(corners !== undefined ? { corners } : {})} />
      ) : (
        <AnimatedTechlineCorners />
      )}
      {children}
    </MotionCard>
  );
}

export const CardTech = CardTechRoot;
export const CardTechHeader = CardHeader;
export const CardTechTitle = CardTitle;
export const CardTechDescription = CardDescription;
export const CardTechContent = CardContent;
export const CardTechFooter = CardFooter;
export const CardTechAction = CardAction;
export const CardTechToolbar = CardToolbar;
