"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, toast as sonnerToast, type ToasterProps } from "sonner";

type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type ToastTheme = "light" | "dark" | "system";

interface ToastProviderProps extends Omit<ToasterProps, "position" | "theme"> {
  position?: ToastPosition;
  /** Theme for toast appearance. Defaults to "system" to follow user preference. */
  theme?: ToastTheme;
}

function Toaster({ position = "bottom-right", theme = "system", ...props }: ToastProviderProps) {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position={position}
      icons={{
        success: <CircleCheckIcon className="size-4 text-muted-foreground" />,
        info: <InfoIcon className="size-4 text-muted-foreground" />,
        warning: <TriangleAlertIcon className="size-4 text-muted-foreground" />,
        error: <OctagonXIcon className="size-4 text-muted-foreground" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success)",
          "--success-text": "var(--success-foreground)",
          "--success-border": "var(--success)",
          "--error-bg": "var(--destructive)",
          "--error-text": "var(--destructive-foreground)",
          "--error-border": "var(--destructive)",
          "--warning-bg": "var(--warning)",
          "--warning-text": "var(--warning-foreground)",
          "--warning-border": "var(--warning)",
          "--info-bg": "var(--info)",
          "--info-text": "var(--info-foreground)",
          "--info-border": "var(--info)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface ToastOptions {
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
}
/**
 * Show a toast notification.
 *
 * - Returns the toast id so callers can update or dismiss it later.
 * - Loading toasts use `Infinity` duration, so callers must dismiss when work completes:
 *   ```ts
 *   const id = toast.loading("Processing...");
 *   // ...after finishing
 *   toast.dismiss(id);
 *   toast.success("Done!");
 *   ```
 */
function toast(message: string, options?: ToastOptions): string | number {
  const duration = options?.duration ?? 5000;
  let toastId: string | number | undefined;

  const toastOptions = {
    description: options?.description,
    duration: options?.type === "loading" ? Infinity : duration,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
    cancel: options?.cancel
      ? {
          label: options.cancel.label,
          onClick:
            options.cancel.onClick ??
            (() => {
              if (toastId !== undefined) {
                sonnerToast.dismiss(toastId);
              } else {
                sonnerToast.dismiss();
              }
            }),
        }
      : undefined,
  };

  switch (options?.type) {
    case "success":
      toastId = sonnerToast.success(message, toastOptions);
      break;
    case "error":
      toastId = sonnerToast.error(message, toastOptions);
      break;
    case "warning":
      toastId = sonnerToast.warning(message, toastOptions);
      break;
    case "info":
      toastId = sonnerToast.info(message, toastOptions);
      break;
    case "loading":
      toastId = sonnerToast.loading(message, toastOptions);
      break;
    default:
      toastId = sonnerToast(message, toastOptions);
      break;
  }

  return toastId;
}

toast.success = (message: string, options?: Omit<ToastOptions, "type">) => {
  return toast(message, { ...options, type: "success" });
};

toast.error = (message: string, options?: Omit<ToastOptions, "type">) => {
  return toast(message, { ...options, type: "error" });
};

toast.warning = (message: string, options?: Omit<ToastOptions, "type">) => {
  return toast(message, { ...options, type: "warning" });
};

toast.info = (message: string, options?: Omit<ToastOptions, "type">) => {
  return toast(message, { ...options, type: "info" });
};

toast.loading = (message: string, options?: Omit<ToastOptions, "type">) => {
  return toast(message, { ...options, type: "loading" });
};

toast.dismiss = (id?: string | number) => {
  sonnerToast.dismiss(id);
};

export { toast, Toaster, Toaster as ToastProvider, type ToastPosition, type ToastTheme };
export type { ToastOptions, ToastType };
