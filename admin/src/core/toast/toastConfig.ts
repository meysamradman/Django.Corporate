import { toast } from '@/components/elements/Sonner';

const defaultOptions = {
  duration: 3000,
  position: 'top-right' as const,
};

export const showSuccessToast = (message: string) => {
  return toast.success(message, defaultOptions);
};

export const showErrorToast = (message: string) => {
  return toast.error(message, {
    ...defaultOptions,
    duration: 5000,
  });
};

export const showWarningToast = (message: string) => {
  return toast.warning(message, defaultOptions);
};

export const showInfoToast = (message: string) => {
  return toast.info(message, defaultOptions);
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    ...defaultOptions,
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