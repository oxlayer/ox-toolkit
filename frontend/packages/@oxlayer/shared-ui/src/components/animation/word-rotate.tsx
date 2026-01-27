"use client";

import { AnimatePresence, motion, type MotionProps } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";

interface WordRotateProps {
  words: string[];
  duration?: number;
  motionProps?: MotionProps;
  className?: string;
}

export function WordRotate({
  words,
  duration = 1000,
  motionProps = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number>(0);
  const prevWidthRef = useRef<number>(0);
  const measureRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentWord = words[index];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  useLayoutEffect(() => {
    if (measureRef.current) {
      const measuredWidth = measureRef.current.offsetWidth;
      prevWidthRef.current = width;
      setWidth(measuredWidth);
    }
  }, [currentWord, width]);

  return (
    <div ref={containerRef} className="overflow-hidden py-2 inline-block">
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute whitespace-nowrap pointer-events-none"
        style={{
          visibility: "hidden",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <span className={cn("text-gradient-green", className)}>{currentWord}</span>
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          className={cn("text-gradient-green inline-block", className)}
          animate={{
            ...(typeof motionProps?.animate === "object" && motionProps.animate !== null
              ? motionProps.animate
              : {}),
            width,
          }}
          initial={{
            ...(typeof motionProps?.initial === "object" && motionProps.initial !== null
              ? motionProps.initial
              : {}),
            width: prevWidthRef.current || width,
          }}
          exit={{
            ...(typeof motionProps?.exit === "object" && motionProps.exit !== null
              ? motionProps.exit
              : {}),
            width,
          }}
          transition={{
            ...(typeof motionProps?.transition === "object" && motionProps.transition !== null
              ? motionProps.transition
              : {}),
            width: {
              duration: 0.25,
              ease: "easeOut",
            },
          }}
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
          }}
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
