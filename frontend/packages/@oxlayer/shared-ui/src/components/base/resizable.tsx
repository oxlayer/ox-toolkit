"use client";

import { cn } from "../../lib/utils";
import { GripVertical } from "lucide-react";
import type { ComponentProps } from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { tv } from "tailwind-variants";

const ResizablePanelGroup = ({
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    data-slot="resizable-panel-group"
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const resizableHandle = tv({
  slots: {
    root: [
      "relative flex w-px items-center justify-center bg-border touch-none",
      "cursor-col-resize data-[panel-group-direction=vertical]:cursor-row-resize",
      "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
      "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
      "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full",
      "data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
      "data-[resize-handle-active]:bg-primary [&[data-panel-group-direction=vertical]>div]:rotate-90",
    ],
    thumb:
      "z-10 flex h-4 w-3 items-center justify-center rounded-md border border-border bg-border",
  },
});

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => {
  const styles = resizableHandle();

  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={styles.root({ className })}
      {...props}
    >
      {withHandle && (
        <div className={styles.thumb()} aria-hidden="true">
          <GripVertical className="size-2.5" aria-hidden="true" focusable="false" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
};

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
