import { toast } from '@/components/elements/Sonner';

const defaultOptions = {
  duration: 3000,
  position: 'top-right' as const,
  closeButton: true,
};

export const showSuccessToast = (message: string, description?: string) => {
  return toast.success(message, {
    ...defaultOptions,
    description,
    className: 'success-toast',
  });
};

export const showErrorToast = (message: string, description?: string) => {
  return toast.error(message, {
    ...defaultOptions,
    description,
    className: 'error-toast',
    duration: 5000,
  });
};

export const showWarningToast = (message: string, description?: string) => {
  return toast.warning(message, {
    ...defaultOptions,
    description,
    className: 'warning-toast',
  });
};

export const showInfoToast = (message: string, description?: string) => {
  return toast.info(message, {
    ...defaultOptions,
    description,
    className: 'info-toast',
  });
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    ...defaultOptions,
    className: 'loading-toast',
  });
};

export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, messages);
};

export const dismissAllToasts = () => {
  toast.dismiss();
}; 