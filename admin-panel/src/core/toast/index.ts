import { type ExternalToast, toast } from 'sonner';
import { ApiError } from '@/types/api/apiError';
import { getHttpError, getNetworkError, shouldUseBackendMessage, isSilentError } from '@/core/messages/errors';

export { toast };

const DEFAULT_OPTIONS: ExternalToast = {
  duration: 3000,
  position: 'top-right',
};

const ERROR_OPTIONS: ExternalToast = {
  ...DEFAULT_OPTIONS,
  duration: 5000,
};

const TOAST_DEDUPE_MS = 1500;
const lastToastMap = new Map<string, number>();

type ErrorToastOptions = {
  customMessage?: string;
  showToast?: boolean;
  silent?: boolean;
  preferBackendMessage?: boolean;
  dedupeKey?: string;
  dedupeMs?: number;
} & ExternalToast;

function shouldSkipDuplicateToast(key: string, dedupeMs: number): boolean {
  const now = Date.now();
  const previous = lastToastMap.get(key);

  if (previous && now - previous < dedupeMs) {
    return true;
  }

  lastToastMap.set(key, now);
  return false;
}

function buildToastDedupeKey(message: string, dedupeKey?: string): string {
  if (dedupeKey && dedupeKey.trim() !== '') {
    return `custom:${dedupeKey}`;
  }
  return `message:${message}`;
}

export function showError(
  error: unknown | string,
  options?: ErrorToastOptions
): string {
  const {
    customMessage,
    showToast = true,
    silent = false,
    preferBackendMessage = true,
    dedupeKey,
    dedupeMs = TOAST_DEDUPE_MS,
    ...toastOptions
  } = options || {};

  if (typeof error === 'string') {
    if (showToast && typeof window !== 'undefined') {
      const key = buildToastDedupeKey(error, dedupeKey);
      if (!shouldSkipDuplicateToast(key, dedupeMs)) {
        toast.error(error, { ...ERROR_OPTIONS, ...toastOptions });
      }
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
      if (preferBackendMessage && shouldUseBackendMessage(statusCode) && error.response.message) {
        errorMessage = error.response.message;
      } else {
        errorMessage = getHttpError(statusCode);
      }
    }
  } else if (error instanceof Error) {
    errorMessage = customMessage || error.message || getNetworkError('network');
  }

  if (showToast && typeof window !== 'undefined') {
    const key = buildToastDedupeKey(errorMessage, dedupeKey);
    if (!shouldSkipDuplicateToast(key, dedupeMs)) {
      toast.error(errorMessage, { ...ERROR_OPTIONS, ...toastOptions });
    }
  }

  return errorMessage;
}

type NotifyApiErrorOptions = ErrorToastOptions & {
  fallbackMessage?: string;
};

export function notifyApiError(error: unknown, options?: NotifyApiErrorOptions): string {
  const { fallbackMessage, customMessage, preferBackendMessage = true, ...rest } = options || {};

  const effectiveCustomMessage =
    customMessage !== undefined
      ? customMessage
      : (preferBackendMessage ? undefined : fallbackMessage);

  return showError(error, {
    customMessage: effectiveCustomMessage,
    preferBackendMessage,
    ...rest,
  });
}

export const showSuccess = (message: string, options?: ExternalToast) => {
  toast.success(message, { ...DEFAULT_OPTIONS, ...options });
};

export const showInfo = (message: string, options?: ExternalToast) => {
  toast.info(message, { ...DEFAULT_OPTIONS, ...options });
};

export const showNeutral = (message: string, options?: ExternalToast) => {
  toast(message, { ...DEFAULT_OPTIONS, ...options });
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
        const errors = (data as any).errors || data;

        if (errors && typeof errors === 'object') {
          Object.entries(errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[field] = messages[0];
            } else if (typeof messages === 'string') {
              fieldErrors[field] = messages;
            }
          });
        }
      }
    }
  }

  return fieldErrors;
}

export function hasFieldErrors(error: unknown): boolean {
  const fieldErrors = extractFieldErrors(error);
  return Object.keys(fieldErrors).length > 0;
}

type FormFieldSetter = (field: string, message: string) => void;

type HandleFormApiErrorOptions = {
  setFieldError?: FormFieldSetter;
  checkFormMessage?: string;
  fallbackMessage?: string;
  showToastForFieldErrors?: boolean;
  preferBackendMessage?: boolean;
  dedupeKey?: string;
};

export function handleFormApiError(error: unknown, options?: HandleFormApiErrorOptions): Record<string, string> {
  const {
    setFieldError,
    checkFormMessage = 'لطفاً خطاهای فرم را بررسی کنید',
    fallbackMessage,
    showToastForFieldErrors = false,
    preferBackendMessage = false,
    dedupeKey,
  } = options || {};

  const fieldErrors = extractFieldErrors(error);
  const hasErrors = Object.keys(fieldErrors).length > 0;

  if (hasErrors) {
    if (setFieldError) {
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setFieldError(field, message);
      });
    }

    if (showToastForFieldErrors) {
      showError(error, {
        customMessage: checkFormMessage,
        preferBackendMessage,
        dedupeKey,
      });
    }

    return fieldErrors;
  }

  notifyApiError(error, {
    customMessage: fallbackMessage,
    preferBackendMessage,
    dedupeKey,
  });

  return {};
}
