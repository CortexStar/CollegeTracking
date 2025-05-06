import { ToastActionElement } from "@/components/ui/toast";

/**
 * Toast configuration type
 */
export interface ToastOptions {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  duration?: number;
}

/**
 * Factory function to create toast helpers
 * @param useToastFn The useToast hook instance
 * @returns Object with toast helper functions
 */
export function createToastHelpers(useToastFn: { toast: (options: ToastOptions) => void }) {
  /**
   * Show a success toast
   * @param message Toast message
   * @param options Additional toast options
   */
  const toastSuccess = (message: string, options: Omit<ToastOptions, 'description' | 'variant'> = {}) => {
    useToastFn.toast({
      title: options.title || "Success",
      description: message,
      ...options,
    });
  };

  /**
   * Show an error toast
   * @param message Error message
   * @param options Additional toast options
   */
  const toastError = (message: string, options: Omit<ToastOptions, 'description' | 'variant'> = {}) => {
    useToastFn.toast({
      title: options.title || "Error",
      description: message,
      variant: "destructive",
      ...options,
    });
  };

  /**
   * Show an info toast
   * @param message Info message
   * @param options Additional toast options
   */
  const toastInfo = (message: string, options: Omit<ToastOptions, 'description' | 'variant'> = {}) => {
    useToastFn.toast({
      title: options.title || "Info",
      description: message,
      ...options,
    });
  };

  return {
    toastSuccess,
    toastError,
    toastInfo,
  };
}