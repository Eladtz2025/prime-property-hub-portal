import * as React from "react";
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const variants = {
  default: "border-border bg-background text-foreground",
  success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
};

export const enhancedToast = {
  show: ({
    title,
    description,
    variant = "default",
    duration = 4000,
    action,
    position = "top-right",
  }: ToastOptions) => {
    const Icon = variant !== "default" ? icons[variant] : null;
    
    return sonnerToast.custom(
      (t) => (
        <div
          className={cn(
            "group pointer-events-auto relative flex w-full items-start space-x-2 rtl:space-x-reverse overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all",
            "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
            variants[variant]
          )}
        >
          {Icon && (
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-semibold">{title}</div>
            )}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      {
        duration,
        position,
      }
    );
  },

  success: (message: string, options?: Omit<ToastOptions, "variant">) =>
    enhancedToast.show({ description: message, variant: "success", ...options }),

  error: (message: string, options?: Omit<ToastOptions, "variant">) =>
    enhancedToast.show({ description: message, variant: "error", ...options }),

  warning: (message: string, options?: Omit<ToastOptions, "variant">) =>
    enhancedToast.show({ description: message, variant: "warning", ...options }),

  info: (message: string, options?: Omit<ToastOptions, "variant">) =>
    enhancedToast.show({ description: message, variant: "info", ...options }),
};

export const EnhancedToaster = () => (
  <SonnerToaster
    className="toaster group"
    position="top-right"
    richColors
    expand
    visibleToasts={4}
    closeButton
    toastOptions={{
      className: cn(
        "toast group toast-[&>button]:bg-primary toast-[&>button]:text-primary-foreground",
        "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg"
      ),
      duration: 4000,
    }}
  />
);