"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { forwardRef, type CSSProperties } from "react";
import { cn } from "../../lib/utils";
import { ScrollArea } from "./scroll-area";

const FullscreenDialog = DialogPrimitive.Root;
const FullscreenDialogPortal = DialogPrimitive.Portal;

const FullscreenDialogTrigger = forwardRef<HTMLButtonElement, DialogPrimitive.Trigger.Props>(
  (props, ref) => {
    return <DialogPrimitive.Trigger ref={ref} data-slot="fullscreen-dialog-trigger" {...props} />;
  }
);
FullscreenDialogTrigger.displayName = "FullscreenDialogTrigger";

const FullscreenDialogClose = forwardRef<HTMLButtonElement, DialogPrimitive.Close.Props>(
  (props, ref) => {
    return <DialogPrimitive.Close ref={ref} data-slot="fullscreen-dialog-close" {...props} />;
  }
);
FullscreenDialogClose.displayName = "FullscreenDialogClose";

function FullscreenDialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-background transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      data-slot="fullscreen-dialog-backdrop"
      {...props}
    />
  );
}

function FullscreenDialogViewport({ className, ...props }: DialogPrimitive.Viewport.Props) {
  return (
    <DialogPrimitive.Viewport
      className={cn("fixed inset-0 z-50", className)}
      data-slot="fullscreen-dialog-viewport"
      {...props}
    />
  );
}

const FullscreenDialogPopup = forwardRef<
  HTMLDivElement,
  DialogPrimitive.Popup.Props & {
    showCloseButton?: boolean;
  }
>(({ className, children, showCloseButton = false, ...props }, ref) => {
  return (
    <FullscreenDialogPortal>
      <FullscreenDialogBackdrop />
      <FullscreenDialogViewport>
        <DialogPrimitive.Popup
          ref={ref}
          className={cn(
            "flex h-screen w-screen flex-col bg-background text-foreground transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
            className
          )}
          style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
          data-slot="fullscreen-dialog-popup"
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute end-4 top-4 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-background opacity-72 outline-none transition-[color,background-color,box-shadow,opacity] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0">
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </FullscreenDialogViewport>
    </FullscreenDialogPortal>
  );
});
FullscreenDialogPopup.displayName = "FullscreenDialogPopup";

function FullscreenDialogHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      data-slot="fullscreen-dialog-header"
      {...props}
    />
  );
}

function FullscreenDialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <ScrollArea className="flex-1">
      <div className={cn("px-8 py-6", className)} data-slot="fullscreen-dialog-body" {...props} />
    </ScrollArea>
  );
}

function FullscreenDialogFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/50 px-6 py-4",
        className
      )}
      data-slot="fullscreen-dialog-footer"
      {...props}
    />
  );
}

function FullscreenDialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("text-sm font-medium", className)}
      data-slot="fullscreen-dialog-title"
      {...props}
    />
  );
}

function FullscreenDialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="fullscreen-dialog-description"
      {...props}
    />
  );
}

export {
  FullscreenDialog,
  FullscreenDialogBackdrop,
  FullscreenDialogBody,
  FullscreenDialogClose,
  FullscreenDialogDescription,
  FullscreenDialogFooter,
  FullscreenDialogHeader,
  FullscreenDialogPopup,
  FullscreenDialogPortal,
  FullscreenDialogTitle,
  FullscreenDialogTrigger,
  FullscreenDialogViewport,
};
