"use client";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

import { cn } from "../../lib/utils";

const PRIMARY_COLOR = "#84cc16";
const PRIMARY_GLOW_COLOR = "rgba(132, 204, 22, 0.6)";

export interface PipelineStage {
  id: string;
  label: string;
  icon: string;
}

export interface WorkflowPipelineProps {
  stages?: PipelineStage[];
  stageDuration?: number;
  transitionDuration?: number;
  primaryColor?: string;
  primaryGlowColor?: string;
  className?: string;
}

const defaultStages: PipelineStage[] = [
  { id: "issue", label: "ISSUE", icon: "proicons:flag" },
  { id: "prd", label: "PRD", icon: "proicons:document" },
  { id: "techspec", label: "TECHSPEC", icon: "proicons:code" },
  { id: "tasks", label: "TASKS", icon: "proicons:bullet-list-tree" },
  { id: "looper", label: "LOOPER", icon: "proicons:arrow-rotate-clockwise" },
];

export function WorkflowPipeline({
  stages = defaultStages,
  stageDuration = 2000,
  transitionDuration = 600,
  primaryColor = PRIMARY_COLOR,
  primaryGlowColor = PRIMARY_GLOW_COLOR,
  className,
}: WorkflowPipelineProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setActiveIndex(prev => (prev + 1) % stages.length);
        setIsTransitioning(false);
      }, transitionDuration);
    }, stageDuration);

    return () => clearInterval(interval);
  }, [stages.length, stageDuration, transitionDuration]);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-1 sm:gap-2 px-1 sm:px-2 w-full",
        className
      )}
    >
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <PipelineNode
            stage={stage}
            isActive={activeIndex === index}
            isPast={index < activeIndex}
            primaryColor={primaryColor}
          />
          {index < stages.length - 1 && (
            <ConnectorLine
              fromIndex={index}
              activeIndex={activeIndex}
              isTransitioning={isTransitioning && activeIndex === index}
              primaryColor={primaryColor}
              primaryGlowColor={primaryGlowColor}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface PipelineNodeProps {
  stage: PipelineStage;
  isActive: boolean;
  isPast: boolean;
  primaryColor: string;
}

function PipelineNode({ stage, isActive, isPast, primaryColor }: PipelineNodeProps) {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 cursor-default relative shrink-0">
      <motion.div
        className="h-9 w-9 sm:h-10 sm:w-10 bg-stone-900 border flex items-center justify-center relative overflow-hidden"
        animate={{
          borderColor: isActive ? primaryColor : "#44403c",
          scale: isActive ? 1.08 : 1,
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <motion.div
          className="relative z-10"
          animate={{
            color: isActive ? primaryColor : isPast ? "#78716c" : "#57534e",
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
        >
          <Icon
            icon={stage.icon}
            className={cn(
              "w-4 h-4 sm:w-5 sm:h-5",
              stage.id === "looper" && isActive && "animate-[spin_2s_linear_infinite]"
            )}
          />
        </motion.div>

        {isActive && (
          <motion.div
            className="absolute inset-0 border"
            style={{ borderColor: primaryColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      <motion.span
        className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider"
        animate={{
          color: isActive ? primaryColor : isPast ? "#78716c" : "#57534e",
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
      >
        {stage.label}
      </motion.span>

      <motion.div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
        animate={{
          backgroundColor: isActive ? primaryColor : "rgba(0,0,0,0)",
          scale: isActive ? 1 : 0,
        }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
    </div>
  );
}

interface ConnectorLineProps {
  fromIndex: number;
  activeIndex: number;
  isTransitioning: boolean;
  primaryColor: string;
  primaryGlowColor: string;
}

function ConnectorLine({
  fromIndex,
  activeIndex,
  isTransitioning,
  primaryColor,
  primaryGlowColor,
}: ConnectorLineProps) {
  const isPast = fromIndex < activeIndex;
  const isActive = isTransitioning;

  return (
    <div className="flex-1 h-[2px] bg-stone-800/60 relative overflow-hidden min-w-[24px]">
      <motion.div
        className="absolute inset-y-0 left-0 h-full"
        style={{ background: primaryColor }}
        animate={{
          width: isPast ? "100%" : isActive ? "100%" : "0%",
          opacity: isPast ? 0.5 : isActive ? 0.8 : 0,
        }}
        transition={{
          duration: isActive ? 0.5 : 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
      />

      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10"
            style={{
              background: primaryColor,
              boxShadow: `0 0 12px 2px ${primaryGlowColor}`,
            }}
            initial={{ left: "0%", opacity: 0, scale: 0.5 }}
            animate={{ left: "100%", opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 h-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${primaryGlowColor} 50%, transparent 100%)`,
            }}
            initial={{ left: "-50%", opacity: 0 }}
            animate={{ left: "100%", opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
