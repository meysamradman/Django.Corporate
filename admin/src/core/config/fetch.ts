import { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { csrfTokenStore } from '@/core/auth/csrfToken';
import { env } from '@/core/config/environment';
import { showError as toastError, showSuccess as toastSuccess } from '@/core/toast';
import { METHOD_TOAST_DEFAULTS, type HttpMethod } from '@/core/toast/types';
import { getNetworkError } from '@/core/messages/errors';

const isServer = typeof window === 'undefined';

interface FetchOptions {
  headers?: Record<string, string>;
  cookieHeader?: string;
  timeout?: number;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith('csrftoken=')) {
        return cookie.substring('csrftoken='.length);
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}

function getCsrfHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const csrfToken = csrfTokenStore.getToken() || getCsrfToken();

  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  return headers;
}

async function baseFetch<T>(
  url: string,
  method: HttpMethod = 'GET',
  body?: BodyInit | Record<string, unknown> | null,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = options?.timeout || 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const methodConfig = METHOD_TOAST_DEFAULTS[method];
  const showSuccess = options?.showSuccessToast === true;
  const showError = options?.showErrorToast ?? methodConfig.showErrorToast;
  const silent = options?.silent ?? false;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getCsrfHeaders(),
    ...options?.headers,
  };

  if (isServer && options?.cookieHeader) {
    headers['Cookie'] = options.cookieHeader;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
    signal: controller.signal,
    cache: 'no-store',
  };

  if (body) {
    if (body instanceof FormData) {
      delete headers['Content-Type'];
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  try {
    let fullUrl = url;
    if (!url.startsWith(env.API_BASE_URL)) {
      fullUrl = `${env.API_BASE_URL}${url}`;
    }

    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);

    let data: ApiResponse<T> | null = null;
    let errorText = '';
    const contentType = response.headers.get('content-type');

    try {
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        errorText = await response.text();
      }
    } catch (jsonError) {
      errorText = await response.text().catch(() => '');
    }

    if (!response.ok) {
      const apiError = new ApiError({
        response: {
          AppStatusCode: data?.metaData?.AppStatusCode || response.status,
          _data: data,
          ok: false,
          message: data?.metaData?.message || errorText || `Error: ${response.status}`,
          errors: data?.errors || data?.data || null,
        },
      });

      if (!silent && showError) {
        toastError(apiError, {
          customMessage: options?.errorMessage,
        });
      }

      throw apiError;
    }

    if (!silent && showSuccess) {
      const successMsg = options?.successMessage || 
                        (data && 'metaData' in data ? data.metaData?.message : null);
      
      if (successMsg) {
        toastSuccess(successMsg);
      }
    }

    if (!data || !contentType?.includes('application/json')) {
      return {
        metaData: {
          status: 'success',
          message: `OK (${response.status})`,
          AppStatusCode: response.status,
          timestamp: new Date().toISOString(),
        },
        data: null as T,
      };
    }

    if (!('metaData' in data)) {
      const responseWithMeta: ApiResponse<T> = {
        metaData: {
          status: 'success',
          message: `Data received successfully (${response.status})`,
          AppStatusCode: response.status,
          timestamp: new Date().toISOString(),
        },
        data: data as T,
      };

      if (data && typeof data === 'object' && 'pagination' in data) {
        (responseWithMeta as any).pagination = (data as any).pagination;
      }

      return responseWithMeta;
    }

    return data as ApiResponse<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new ApiError({
        response: {
          AppStatusCode: 504,
          _data: null,
          ok: false,
          message: getNetworkError('timeout'),
          errors: null,
        },
      });

      if (!silent && showError) {
        toastError(timeoutError, {
          customMessage: options?.errorMessage,
        });
      }

      throw timeoutError;
    }

    if (!(error instanceof ApiError)) {
      const networkError = new ApiError({
        response: {
          AppStatusCode: 503,
          _data: null,
          ok: false,
          message: error instanceof Error ? error.message : getNetworkError('network'),
          errors: null,
        },
      });

      if (!silent && showError) {
        toastError(networkError, {
          customMessage: options?.errorMessage,
        });
      }

      throw networkError;
    }

    throw error;
  }
}

async function downloadFile(
  url: string,
  filename: string,
  method: string = 'GET',
  body?: BodyInit | Record<string, unknown> | null,
  options?: FetchOptions
): Promise<void> {
  if (method === 'GET' && !body) {
    let fullUrl = url;
    if (!url.startsWith(env.API_BASE_URL)) {
      fullUrl = `${env.API_BASE_URL}${url}`;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = fullUrl;
    document.body.appendChild(iframe);

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {
        // Silent fail
      }
    }, 5000);

    return;
  }

  const headers: Record<string, string> = {
    ...getCsrfHeaders(),
    ...options?.headers,
  };

  if (isServer && options?.cookieHeader) {
    headers['Cookie'] = options.cookieHeader;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body) {
    if (body instanceof FormData) {
      delete headers['Content-Type'];
      fetchOptions.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }
  }

  let fullUrl = url;
  if (!url.startsWith(env.API_BASE_URL)) {
    fullUrl = `${env.API_BASE_URL}${url}`;
  }

  const response = await fetch(fullUrl, fetchOptions);

  if (!response.ok) {
    let errorMessage = `Download failed: ${response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData?.metaData?.message || errorData?.message || errorMessage;
      }
    } catch {
      // Silent fail
    }

    throw new ApiError({
      response: {
        AppStatusCode: response.status,
        _data: null,
        ok: false,
        message: errorMessage,
        errors: null,
      },
    });
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export const fetchApi = {
  get: async <T>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'GET', undefined, options);
  },

  post: async <T>(
    url: string,
    body?: BodyInit | Record<string, unknown> | null,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'POST', body, options);
  },

  put: async <T>(
    url: string,
    body?: BodyInit | Record<string, unknown> | null,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'PUT', body, options);
  },

  patch: async <T>(
    url: string,
    body?: BodyInit | Record<string, unknown> | null,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'PATCH', body, options);
  },

  delete: async <T>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'DELETE', undefined, options);
  },

  downloadFile: async (
    url: string,
    filename: string,
    method: string = 'GET',
    body?: BodyInit | Record<string, unknown> | null,
    options?: FetchOptions
  ): Promise<void> => {
    return downloadFile(url, filename, method, body, options);
  },

  /**
   * Public API call without credentials
   * Used for OTP settings and CAPTCHA generation to prevent session creation
   */
  getPublic: async <T>(url: string, options?: Omit<FetchOptions, 'cookieHeader'>): Promise<ApiResponse<T>> => {
    const controller = new AbortController();
    const timeout = options?.timeout || 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const fetchOptions: RequestInit = {
      method: 'GET',
      headers,
      credentials: 'omit', // ✅ NO credentials - prevents session creation
      signal: controller.signal,
      cache: 'no-store',
    };

    try {
      let fullUrl = url;
      if (!url.startsWith(env.API_BASE_URL)) {
        fullUrl = `${env.API_BASE_URL}${url}`;
      }

      const response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json') ? await response.json() : null;

      if (!response.ok) {
        throw new ApiError({
          response: {
            AppStatusCode: data?.metaData?.AppStatusCode || response.status,
            _data: data,
            ok: false,
            message: data?.metaData?.message || `Error: ${response.status}`,
            errors: data?.errors || null,
          },
        });
      }

      return data as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError({
          response: {
            AppStatusCode: 504,
            _data: null,
            ok: false,
            message: getNetworkError('timeout'),
            errors: null,
          },
        });
      }

      if (!(error instanceof ApiError)) {
        throw new ApiError({
          response: {
            AppStatusCode: 503,
            _data: null,
            ok: false,
            message: error instanceof Error ? error.message : getNetworkError('network'),
            errors: null,
          },
        });
      }

      throw error;
    }
  },
};
