"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import type { CornerPosition } from "../../lib/utils";

interface CornerFiducialsProps {
  corners?: CornerPosition[];
}

const transition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

const emptySubscribe = () => () => { };
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function CornerFiducials({
  corners = ["top-left", "top-right", "bottom-left", "bottom-right"],
}: CornerFiducialsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  const showTopLeft = corners.includes("top-left");
  const showTopRight = corners.includes("top-right");
  const showBottomLeft = corners.includes("bottom-left");
  const showBottomRight = corners.includes("bottom-right");

  const topLeftOpacity = mounted ? (showTopLeft ? 1 : 0) : 0;
  const topRightOpacity = mounted ? (showTopRight ? 1 : 0) : 0;
  const bottomLeftOpacity = mounted ? (showBottomLeft ? 1 : 0) : 0;
  const bottomRightOpacity = mounted ? (showBottomRight ? 1 : 0) : 0;

  return (
    <>
      {/* Top Left */}
      <>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 10, opacity: topRightOpacity }}
          variants={{ hover: { height: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute left-0 top-0 w-[2px] bg-black origin-top"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 10, opacity: topRightOpacity }}
          variants={{ hover: { width: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute left-0 top-0 h-[2px] bg-black origin-left"
        />
      </>
      {/* Top Right */}
      <>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 10, opacity: topRightOpacity }}
          variants={{ hover: { height: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute right-0 top-0 w-[2px] bg-black origin-top"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 10, opacity: topRightOpacity }}
          variants={{ hover: { width: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute right-0 top-0 h-[2px] bg-black origin-right"
        />
      </>
      {/* Bottom Left */}
      <>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 10, opacity: bottomLeftOpacity }}
          variants={{ hover: { height: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute left-0 bottom-0 w-[2px] bg-black origin-bottom"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 10, opacity: bottomLeftOpacity }}
          variants={{ hover: { width: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute left-0 bottom-0 h-[2px] bg-black origin-left"
        />
      </>
      {/* Bottom Right */}
      <>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 10, opacity: bottomRightOpacity }}
          variants={{ hover: { height: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute right-0 bottom-0 w-[2px] bg-black origin-bottom"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 10, opacity: bottomRightOpacity }}
          variants={{ hover: { width: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute right-0 bottom-0 h-[2px] bg-black origin-right"
        />
      </>
    </>
  );
}

export type { CornerPosition };
