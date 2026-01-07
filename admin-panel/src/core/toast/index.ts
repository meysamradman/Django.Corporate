import { type ExternalToast } from 'sonner';
import { toast as sonnerToast } from '@/components/elements/Sonner';
import { ApiError } from '@/types/api/apiError';
import { getHttpError, getNetworkError, shouldUseBackendMessage, isSilentError } from '@/core/messages/errors';

export const toast = sonnerToast;

const DEFAULT_OPTIONS: ExternalToast = {
  duration: 3000,
  position: 'top-right',
};

const ERROR_OPTIONS: ExternalToast = {
  ...DEFAULT_OPTIONS,
  duration: 5000,
};

export function showError(
  error: unknown | string,
  options?: {
    customMessage?: string;
    showToast?: boolean;
    silent?: boolean;
  } & ExternalToast
): string {
  const { customMessage, showToast = true, silent = false, ...toastOptions } = options || {};

  if (typeof error === 'string') {
    if (showToast && typeof window !== 'undefined') {
      toast.error(error, { ...ERROR_OPTIONS, ...toastOptions });
    }
    return error;
  }

  let errorMessage = customMessage || getNetworkError('unknown');
  let statusCode: number | undefined;

  if (error instanceof ApiError) {
    statusCode = error.response.AppStatusCode;

    if (isSilentError(statusCode) || silent) {
      return errorMessage;
    }

    if (!customMessage) {
      if (shouldUseBackendMessage(statusCode) && error.response.message) {
        errorMessage = error.response.message;
      } else {
        errorMessage = getHttpError(statusCode);
      }
    }
  } else if (error instanceof Error) {
    errorMessage = customMessage || error.message || getNetworkError('network');
  }

  if (showToast && typeof window !== 'undefined') {
    toast.error(errorMessage, { ...ERROR_OPTIONS, ...toastOptions });
  }

  return errorMessage;
}

export const showSuccess = (message: string, options?: ExternalToast) => {
  toast.success(message, { ...DEFAULT_OPTIONS, ...options });
};

export const showInfo = (message: string, options?: ExternalToast) => {
  toast.info(message, { ...DEFAULT_OPTIONS, ...options });
};

export const showWarning = (message: string, options?: ExternalToast) => {
  toast.warning(message, { ...DEFAULT_OPTIONS, ...options });
};

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
