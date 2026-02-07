import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps, toast as originalToast } from "sonner"

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

const toast = {
  ...originalToast,
  success: (message: string, options?: any) =>
    originalToast.success(message, { ...options, className: `toast toast-success ${options?.className || ''}` }),
  error: (message: string, options?: any) =>
    originalToast.error(message, { ...options, className: `toast toast-error ${options?.className || ''}` }),
  warning: (message: string, options?: any) =>
    originalToast.warning(message, { ...options, className: `toast toast-warning ${options?.className || ''}` }),
  info: (message: string, options?: any) =>
    originalToast.info(message, { ...options, className: `toast toast-info ${options?.className || ''}` }),
  loading: (message: string, options?: any) =>
    originalToast.loading(message, { ...options, className: `toast toast-loading ${options?.className || ''}` }),
  promise: <T,>(promise: Promise<T>, messages: any) =>
    originalToast.promise(promise, messages),
}

export { Toaster, toast }
