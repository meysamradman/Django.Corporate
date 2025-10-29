import { toast } from '@/components/elements/Sonner';

const defaultOptions = {
  duration: 3000,
  position: 'top-right' as const,
  closeButton: true,
};

// Wrapper functions - حالا toast خودش رنگ‌ها رو اضافه می‌کنه
export const showSuccessToast = (message: string, description?: string) => {
  return toast.success(message, {
    ...defaultOptions,
    description,
  });
};

export const showErrorToast = (message: string, description?: string) => {
  return toast.error(message, {
    ...defaultOptions,
    description,
    duration: 5000,
  });
};

export const showWarningToast = (message: string, description?: string) => {
  return toast.warning(message, {
    ...defaultOptions,
    description,
  });
};

export const showInfoToast = (message: string, description?: string) => {
  return toast.info(message, {
    ...defaultOptions,
    description,
  });
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