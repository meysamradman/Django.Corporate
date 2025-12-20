import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps, toast as originalToast, type ExternalToast } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
    />
  )
}

type ToastOptions = ExternalToast & {
  className?: string
}

const toast = {
  ...originalToast,
  success: (message: string, options?: ToastOptions) => 
    originalToast.success(message, { ...options, className: `toast toast-success ${options?.className || ''}` }),
  error: (message: string, options?: ToastOptions) => 
    originalToast.error(message, { ...options, className: `toast toast-error ${options?.className || ''}` }),
  warning: (message: string, options?: ToastOptions) => 
    originalToast.warning(message, { ...options, className: `toast toast-warning ${options?.className || ''}` }),
  info: (message: string, options?: ToastOptions) => 
    originalToast.info(message, { ...options, className: `toast toast-info ${options?.className || ''}` }),
  loading: (message: string, options?: ToastOptions) => 
    originalToast.loading(message, { ...options, className: `toast toast-loading ${options?.className || ''}` }),
  promise: <T,>(
    promise: Promise<T>, 
    messages: { 
      loading: string; 
      success: string | ((data: T) => string); 
      error: string | ((error: unknown) => string);
    },
    options?: ToastOptions
  ) => {
    // برای promise، sonner خودش loading, success, error را مدیریت می‌کند
    // className را به عنوان option سوم پاس می‌دهیم که به همه states اعمال می‌شود
    // اما از CSS می‌توانیم بر اساس data-type استایل‌های مختلف اعمال کنیم
    return originalToast.promise(promise, messages, {
      ...options,
      className: `toast ${options?.className || ''}`,
    });
  },
}

export { Toaster, toast }
