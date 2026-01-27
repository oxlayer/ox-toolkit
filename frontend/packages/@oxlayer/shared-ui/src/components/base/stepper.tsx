"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { Check } from "lucide-react";
import * as React from "react";
import { createContext, useContext } from "react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

// Types
type StepperOrientation = "horizontal" | "vertical";
type StepState = "active" | "completed" | "inactive" | "loading";
type StepIndicators = {
  active?: React.ReactNode;
  inactive?: React.ReactNode;
  loading?: React.ReactNode;
};

interface StepperContextValue {
  activeStep: number;
  setActiveStep: (step: number) => void;
  stepsCount: number;
  orientation: StepperOrientation;
  registerTrigger: (node: HTMLButtonElement | null) => void;
  triggerNodes: HTMLButtonElement[];
  focusNext: (currentIdx: number) => void;
  focusPrev: (currentIdx: number) => void;
  focusFirst: () => void;
  focusLast: () => void;
  indicators: StepIndicators;
}

interface StepItemContextValue {
  step: number;
  state: StepState;
  isDisabled: boolean;
  isLoading: boolean;
  disabledInfo?: React.ReactNode;
}

const StepperContext = createContext<StepperContextValue | undefined>(undefined);
const StepItemContext = createContext<StepItemContextValue | undefined>(undefined);

function useStepper() {
  const ctx = useContext(StepperContext);
  if (!ctx) throw new Error("useStepper must be used within a Stepper");
  return ctx;
}

function useStepItem() {
  const ctx = useContext(StepItemContext);
  if (!ctx) throw new Error("useStepItem must be used within a StepperItem");
  return ctx;
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: StepperOrientation;
  indicators?: StepIndicators;
}

function Stepper({
  defaultValue = 1,
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  children,
  indicators = {},
  ...props
}: StepperProps) {
  const [activeStep, setActiveStep] = React.useState(defaultValue);
  const [triggerNodes, setTriggerNodes] = React.useState<HTMLButtonElement[]>([]);

  // Register/unregister triggers
  const registerTrigger = React.useCallback((node: HTMLButtonElement | null) => {
    setTriggerNodes(prev => {
      if (node && !prev.includes(node)) {
        return [...prev, node];
      } else if (!node && prev.includes(node!)) {
        return prev.filter(n => n !== node);
      } else {
        return prev;
      }
    });
  }, []);

  const handleSetActiveStep = React.useCallback(
    (step: number) => {
      if (value === undefined) {
        setActiveStep(step);
      }
      onValueChange?.(step);
    },
    [value, onValueChange]
  );

  const currentStep = value ?? activeStep;

  // Keyboard navigation logic
  const focusTrigger = (idx: number) => {
    if (triggerNodes[idx]) triggerNodes[idx].focus();
  };
  const focusNext = (currentIdx: number) => focusTrigger((currentIdx + 1) % triggerNodes.length);
  const focusPrev = (currentIdx: number) =>
    focusTrigger((currentIdx - 1 + triggerNodes.length) % triggerNodes.length);
  const focusFirst = () => focusTrigger(0);
  const focusLast = () => focusTrigger(triggerNodes.length - 1);

  // Context value
  const contextValue = React.useMemo<StepperContextValue>(
    () => ({
      activeStep: currentStep,
      setActiveStep: handleSetActiveStep,
      stepsCount: React.Children.toArray(children).filter(
        (child): child is React.ReactElement =>
          React.isValidElement(child) &&
          (child.type as { displayName?: string }).displayName === "StepperItem"
      ).length,
      orientation,
      registerTrigger,
      focusNext,
      focusPrev,
      focusFirst,
      focusLast,
      triggerNodes,
      indicators,
    }),
    [
      currentStep,
      handleSetActiveStep,
      children,
      orientation,
      registerTrigger,
      triggerNodes,
      indicators,
    ]
  );

  return (
    <TooltipProvider>
      <StepperContext.Provider value={contextValue}>
        <div
          role="tablist"
          aria-orientation={orientation}
          data-slot="stepper"
          className={cn("w-full", className)}
          data-orientation={orientation}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    </TooltipProvider>
  );
}

interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  completed?: boolean;
  disabled?: boolean;
  loading?: boolean;
  disabledInfo?: React.ReactNode;
}

function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  disabledInfo,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { activeStep } = useStepper();

  const state: StepState =
    activeStep === step ? "active" : completed || step < activeStep ? "completed" : "inactive";

  const isLoading = loading && step === activeStep;

  return (
    <StepItemContext.Provider
      value={{ step, state, isDisabled: disabled, isLoading, disabledInfo }}
    >
      <div
        data-slot="stepper-item"
        className={cn(
          "group/step flex items-center justify-center group-data-[orientation=horizontal]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:flex-col not-last:flex-1",
          className
        )}
        data-state={state}
        {...(isLoading ? { "data-loading": true } : {})}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  );
}

interface StepperTriggerProps extends useRender.ComponentProps<"button"> {
  tabIndex?: number;
}

function StepperTrigger({
  className,
  children: triggerChildren,
  tabIndex,
  render,
  ...props
}: StepperTriggerProps) {
  const { state, isLoading, disabledInfo, step, isDisabled } = useStepItem();
  const stepperCtx = useStepper();
  const {
    setActiveStep,
    activeStep,
    registerTrigger,
    triggerNodes,
    focusNext,
    focusPrev,
    focusFirst,
    focusLast,
  } = stepperCtx;
  const isSelected = activeStep === step;
  const id = `stepper-tab-${step}`;
  const panelId = `stepper-panel-${step}`;

  // Register this trigger for keyboard navigation
  const btnRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (btnRef.current) {
      registerTrigger(btnRef.current);
    }
  }, [registerTrigger]);

  // Find our index among triggers for navigation
  const myIdx = React.useMemo(
    () => triggerNodes.findIndex((n: HTMLButtonElement) => n === btnRef.current),
    [triggerNodes]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        if (myIdx !== -1 && focusNext) focusNext(myIdx);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        if (myIdx !== -1 && focusPrev) focusPrev(myIdx);
        break;
      case "Home":
        e.preventDefault();
        if (focusFirst) focusFirst();
        break;
      case "End":
        e.preventDefault();
        if (focusLast) focusLast();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        setActiveStep(step);
        break;
    }
  };

  const defaultProps = {
    ref: btnRef,
    role: "tab" as const,
    id,
    "aria-selected": isSelected,
    "aria-controls": panelId,
    tabIndex: typeof tabIndex === "number" ? tabIndex : isSelected ? 0 : -1,
    "data-slot": "stepper-trigger",
    "data-state": state,
    ...(isLoading ? { "data-loading": true } : {}),
    className: cn(
      "cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center gap-3 rounded-full outline-none focus-visible:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-60",
      className
    ),
    onClick: () => setActiveStep(step),
    onKeyDown: handleKeyDown,
    disabled: isDisabled,
    ...(render !== undefined ? {} : { type: "button" as const }),
    children: triggerChildren,
  };

  const button = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });

  // Conditionally wrap with Tooltip when disabled and disabledInfo is provided
  // Wrap disabled button in span to allow hover events (disabled buttons don't trigger hover)
  if (isDisabled && disabledInfo) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex">{button}</span>} />
        <TooltipContent>{disabledInfo}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function StepperIndicator({
  children: indicatorChildren,
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const { state, isLoading } = useStepItem();
  const { indicators } = useStepper();

  const defaultProps = {
    "data-slot": "stepper-indicator",
    "data-state": state,
    className: cn(
      "relative flex items-center overflow-hidden justify-center size-6 shrink-0 border-background bg-accent text-accent-foreground rounded-md text-xs data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      className
    ),
    children: (
      <div className="absolute">
        {state === "completed" ? (
          <Check className="size-4" />
        ) : isLoading && indicators?.loading ? (
          indicators.loading
        ) : state === "active" && indicators?.active ? (
          indicators.active
        ) : state === "inactive" && indicators?.inactive ? (
          indicators.inactive
        ) : (
          indicatorChildren
        )}
      </div>
    ),
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });
}

function StepperSeparator({ className, render, ...props }: useRender.ComponentProps<"div">) {
  const { state } = useStepItem();

  const defaultProps = {
    "data-slot": "stepper-separator",
    "data-state": state,
    className: cn(
      "m-0.5 rounded-full bg-muted group-data-[orientation=vertical]/stepper-nav:h-12 group-data-[orientation=vertical]/stepper-nav:w-0.5 group-data-[orientation=horizontal]/stepper-nav:h-0.5 group-data-[orientation=horizontal]/stepper-nav:flex-1",
      className
    ),
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });
}

function StepperTitle({ children, className, render, ...props }: useRender.ComponentProps<"h3">) {
  const { state } = useStepItem();

  const defaultProps = {
    "data-slot": "stepper-title",
    "data-state": state,
    className: cn("text-xs/relaxed uppercase font-mono leading-none", className),
    children,
  };

  return useRender({
    defaultTagName: "h3",
    props: mergeProps<"h3">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });
}

function StepperDescription({
  children,
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const { state } = useStepItem();

  const defaultProps = {
    "data-slot": "stepper-description",
    "data-state": state,
    className: cn("text-xs mt-1 text-muted-foreground", className),
    children,
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });
}

function StepperNav({ children, className, render, ...props }: useRender.ComponentProps<"nav">) {
  const { activeStep, orientation } = useStepper();

  const defaultProps = {
    "data-slot": "stepper-nav",
    "data-state": activeStep,
    "data-orientation": orientation,
    className: cn(
      "group/stepper-nav inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
      className
    ),
    children,
  };

  return useRender({
    defaultTagName: "nav",
    props: mergeProps<"nav">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });
}

function StepperPanel({ children, className, render, ...props }: useRender.ComponentProps<"div">) {
  const { activeStep } = useStepper();

  const defaultProps = {
    "data-slot": "stepper-panel",
    "data-state": activeStep,
    className: cn("w-full", className),
    children,
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });
}

interface StepperContentProps extends useRender.ComponentProps<"div"> {
  value: number;
  forceMount?: boolean;
}

function StepperContent({
  value,
  forceMount,
  children,
  className,
  render,
  ...props
}: StepperContentProps) {
  const { activeStep } = useStepper();
  const isActive = value === activeStep;

  const defaultProps = {
    "data-slot": "stepper-content",
    "data-state": activeStep,
    className: cn("w-full", className, !isActive && forceMount && "hidden"),
    hidden: !isActive && forceMount,
    children,
  };

  const rendered = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });

  if (!forceMount && !isActive) {
    return null;
  }

  return rendered;
}

export {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  useStepItem,
  useStepper,
  type StepperContentProps,
  type StepperItemProps,
  type StepperProps,
  type StepperTriggerProps,
};
