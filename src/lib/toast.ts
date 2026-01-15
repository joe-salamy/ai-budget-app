import { toast as sonnerToast } from "sonner";

/**
 * Toast notification utilities using Sonner
 * Provides a convenient API for showing success, error, warning, and info toasts
 */

export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    return sonnerToast.error(message, { description });
  },

  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, { description });
  },

  info: (message: string, description?: string) => {
    return sonnerToast.info(message, { description });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, { loading, success, error });
  },
};
