import { type ExternalToast } from 'sonner';
import { toast as sonnerToast } from '@/components/elements/Sonner';
import { getHttpError, getNetworkError, shouldUseBackendMessage, isSilentError } from '@/core/messages/errors';
import { ApiError } from '@/types/api/apiError';

export const toast = sonnerToast;

const DEFAULT_OPTIONS: ExternalToast = {
  duration: 3000,
  position: 'top-right',
};

const ERROR_OPTIONS: ExternalToast = {
  ...DEFAULT_OPTIONS,
  duration: 5000,
};

export function showSuccess(message: string, options?: ExternalToast): string | number {
  if (typeof window === 'undefined') return '';
  return toast.success(message, { ...DEFAULT_OPTIONS, ...options });
}

export function showError(
  error: unknown,
  options?: {
    customMessage?: string;
    showToast?: boolean;
    silent?: boolean;
  } & ExternalToast
): string {
  const { customMessage, showToast = true, silent = false, ...toastOptions } = options || {};

  let errorMessage = getNetworkError('unknown');
  let statusCode: number | undefined;

  if (error instanceof ApiError) {
    statusCode = error.response.AppStatusCode;
    
    if (isSilentError(statusCode) || silent) {
      return errorMessage;
    }

    if (customMessage) {
      errorMessage = customMessage;
    } else if (shouldUseBackendMessage(statusCode) && error.response.message) {
      errorMessage = error.response.message;
    } else {
      errorMessage = getHttpError(statusCode);
    }
  } else if (error instanceof Error) {
    errorMessage = error.message || getNetworkError('network');
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  if (showToast && typeof window !== 'undefined') {
    toast.error(errorMessage, { ...ERROR_OPTIONS, ...toastOptions });
  }

  return errorMessage;
}

export function showWarning(message: string, options?: ExternalToast): string | number {
  if (typeof window === 'undefined') return '';
  return toast.warning(message, { ...DEFAULT_OPTIONS, ...options });
}

export function showInfo(message: string, options?: ExternalToast): string | number {
  if (typeof window === 'undefined') return '';
  return toast.info(message, { ...DEFAULT_OPTIONS, ...options });
}

export function showLoading(message: string, options?: ExternalToast): string | number {
  if (typeof window === 'undefined') return '';
  return toast.loading(message, { ...DEFAULT_OPTIONS, ...options });
}

export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error?: string | ((error: unknown) => string);
  },
  options?: ExternalToast
): void {
  toast.promise(promise, {
    loading: messages.loading,
    success: (data: T) => {
      if (typeof messages.success === 'function') {
        return messages.success(data);
      }
      return messages.success;
    },
    error: (error: unknown) => {
      if (messages.error) {
        if (typeof messages.error === 'function') {
          return messages.error(error);
        }
        return messages.error;
      }
      return showError(error, { showToast: false });
    },
    ...DEFAULT_OPTIONS,
    ...options,
  });
}

export async function withToast<T>(
  promise: Promise<T>,
  options?: {
    successMessage?: string;
    showSuccessToast?: boolean;
    errorMessage?: string;
    showErrorToast?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
): Promise<T> {
  const {
    successMessage,
    showSuccessToast: showSucc = true,
    errorMessage,
    showErrorToast: showErr = true,
    onSuccess,
    onError,
  } = options || {};

  try {
    const result = await promise;

    if (showSucc && successMessage) {
      showSuccess(successMessage);
    }

    onSuccess?.(result);
    return result;
  } catch (error) {
    if (showErr) {
      showError(error, { customMessage: errorMessage });
    }

    onError?.(error);
    throw error;
  }
}

export function extractFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error instanceof ApiError) {
    if (error.response.AppStatusCode === 422 || error.response.AppStatusCode === 400) {
      const data = error.response._data;

      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            fieldErrors[field] = messages[0];
          } else if (typeof messages === 'string') {
            fieldErrors[field] = messages;
          }
        });
      }
    }
  }

  return fieldErrors;
}

export function hasFieldErrors(error: unknown): boolean {
  const fieldErrors = extractFieldErrors(error);
  return Object.keys(fieldErrors).length > 0;
}

export function isValidationError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.response.AppStatusCode === 422 || error.response.AppStatusCode === 400;
  }
  return false;
}

export function dismissAll(): void {
  toast.dismiss();
}

export function dismiss(toastId: string | number): void {
  toast.dismiss(toastId);
}

export {
  getHttpError,
  getNetworkError,
  shouldUseBackendMessage,
  isSilentError,
};

