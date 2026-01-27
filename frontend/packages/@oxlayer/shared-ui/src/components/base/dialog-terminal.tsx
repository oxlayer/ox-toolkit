"use client";

import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { TerminalIcon } from "lucide-react";

// Re-export Root and Trigger
export {
  Dialog as DialogTerminal,
  DialogTrigger as DialogTerminalTrigger,
  DialogClose as DialogTerminalClose,
};

/**
 * Terminal color tokens - intentionally fixed colors that don't follow theme switching.
 * Terminal dialogs maintain a consistent dark appearance regardless of the app's theme
 * to preserve the authentic terminal aesthetic and ensure readability of terminal content.
 */
const TERMINAL_COLORS = {
  /** Terminal background - near-black for authentic terminal look */
  background: "#0c0c0c",
  /** Terminal header background - slightly lighter for visual hierarchy */
  headerBackground: "#1a1a1a",
} as const;

export function DialogTerminalPopup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPopup>) {
  return (
    <DialogPopup
      className={cn(
        // Terminal Styling - uses fixed dark colors for authentic terminal appearance
        "border-stone-800 text-stone-300 shadow-2xl p-0 gap-0 overflow-hidden",
        "sm:max-w-4xl",
        className
      )}
      style={{ backgroundColor: TERMINAL_COLORS.background }}
      showCloseButton={false}
      {...props}
    >
      {children}
    </DialogPopup>
  );
}

interface DialogTerminalHeaderProps extends React.ComponentProps<"div"> {
  rightContent?: React.ReactNode;
}

export function DialogTerminalHeader({
  className,
  children,
  rightContent,
  ...props
}: DialogTerminalHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-stone-800 select-none",
        className
      )}
      style={{ backgroundColor: TERMINAL_COLORS.headerBackground }}
      data-slot="dialog-terminal-header"
      {...props}
    >
      <div className="flex items-center gap-3">
        {/* Mac-like window controls */}
        <div className="flex gap-1.5">
          <DialogClose className="outline-none border-0 p-0 bg-transparent hover:bg-transparent">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
          </DialogClose>
          {/* Decorative controls intentionally non-interactive */}
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        {children}
      </div>
      {rightContent}
    </div>
  );
}

export function DialogTerminalTitle({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  return (
    <DialogTitle
      className={cn(
        "flex items-center gap-2 font-mono text-sm font-medium text-stone-400 ml-2",
        className
      )}
      {...props}
    >
      <TerminalIcon className="w-4 h-4" />
      {children}
    </DialogTitle>
  );
}

export function DialogTerminalDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  return (
    <DialogDescription className={cn("text-stone-500 font-mono text-xs", className)} {...props} />
  );
}

export function DialogTerminalBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-mono text-sm text-stone-300 h-full overflow-hidden flex flex-col px-0",
        className
      )}
      style={{ backgroundColor: TERMINAL_COLORS.background }}
      {...props}
    />
  );
}
