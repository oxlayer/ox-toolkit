"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import type { CornerPosition } from "../../lib/utils";

interface CornerFiducialsProps {
  corners?: CornerPosition[];
}

const transition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

const emptySubscribe = () => () => {};
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
          animate={{ height: 0, opacity: topLeftOpacity }}
          variants={{ hover: { height: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute left-0 top-0 w-px bg-lime-500 origin-top"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 0, opacity: topLeftOpacity }}
          variants={{ hover: { width: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute left-0 top-0 h-px bg-lime-500 origin-left"
        />
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: topLeftOpacity }}
          variants={{
            initial: { color: "#78716c", opacity: topLeftOpacity },
            hover: { color: "#84cc16", opacity: 1 },
          }}
          transition={transition}
          className="absolute -top-1.5 -left-1.5 w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M6 0V12M0 6H12" stroke="currentColor" strokeWidth="1"></path>
        </motion.svg>
      </>
      {/* Top Right */}
      <>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 0, opacity: topRightOpacity }}
          variants={{ hover: { height: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute right-0 top-0 w-px bg-lime-500 origin-top"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 0, opacity: topRightOpacity }}
          variants={{ hover: { width: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute right-0 top-0 h-px bg-lime-500 origin-right"
        />
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: topRightOpacity }}
          variants={{
            initial: { color: "#78716c", opacity: topRightOpacity },
            hover: { color: "#84cc16", opacity: 1 },
          }}
          transition={transition}
          className="absolute -top-1.5 -right-1.5 w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M6 0V12M0 6H12" stroke="currentColor" strokeWidth="1"></path>
        </motion.svg>
      </>
      {/* Bottom Left */}
      <>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 0, opacity: bottomLeftOpacity }}
          variants={{ hover: { height: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute left-0 bottom-0 w-px bg-lime-500 origin-bottom"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 0, opacity: bottomLeftOpacity }}
          variants={{ hover: { width: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute left-0 bottom-0 h-px bg-lime-500 origin-left"
        />
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: bottomLeftOpacity }}
          variants={{
            initial: { color: "#78716c", opacity: bottomLeftOpacity },
            hover: { color: "#84cc16", opacity: 1 },
          }}
          transition={transition}
          className="absolute -bottom-1.5 -left-1.5 w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M6 0V12M0 6H12" stroke="currentColor" strokeWidth="1"></path>
        </motion.svg>
      </>
      {/* Bottom Right */}
      <>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 0, opacity: bottomRightOpacity }}
          variants={{ hover: { height: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute right-0 bottom-0 w-px bg-lime-500 origin-bottom"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 0, opacity: bottomRightOpacity }}
          variants={{ hover: { width: "20px", opacity: 1 } }}
          transition={transition}
          className="absolute right-0 bottom-0 h-px bg-lime-500 origin-right"
        />
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: bottomRightOpacity }}
          variants={{
            initial: { color: "#78716c", opacity: bottomRightOpacity },
            hover: { color: "#84cc16", opacity: 1 },
          }}
          transition={transition}
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M6 0V12M0 6H12" stroke="currentColor" strokeWidth="1"></path>
        </motion.svg>
      </>
    </>
  );
}

export type { CornerPosition };
