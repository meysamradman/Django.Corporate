export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
}

export interface ToastConfig {
  showSuccessToast: boolean;
  showErrorToast: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const METHOD_TOAST_DEFAULTS: Record<HttpMethod, ToastConfig> = {
  GET: { showSuccessToast: false, showErrorToast: false },
  POST: { showSuccessToast: false, showErrorToast: true },
  PUT: { showSuccessToast: false, showErrorToast: true },
  PATCH: { showSuccessToast: false, showErrorToast: true },
  DELETE: { showSuccessToast: false, showErrorToast: true },
} as const;
