import { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { getNetworkError } from '@/core/messages/errors';

type RequestOptions = {
  headers?: Record<string, string>;
  timeout?: number;
  cache?: RequestCache;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ExtendedRequestInit = RequestInit & { next?: RequestOptions['next'] };

const joinUrl = (base: string, path: string): string => {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const resolveApiUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;

  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  // Always call backend APIs through the Next rewrite (`/api/*`) on the client.
  // On the server, call the backend origin directly to avoid relative-fetch pitfalls.
  const apiPath = cleanUrl === '/api' || cleanUrl.startsWith('/api/') ? cleanUrl : `/api${cleanUrl}`;

  if (typeof window === 'undefined') {
    const origin = process.env.API_INTERNAL_ORIGIN?.trim().replace(/\/$/, '');
    if (!origin) {
      throw new Error('API_INTERNAL_ORIGIN is required for server-side fetch.');
    }
    return joinUrl(origin, apiPath);
  }

  // Client-side: keep it relative so Next rewrites can proxy it.
  return apiPath;
};

async function request<T>(
  url: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options?.timeout || 30000);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...options?.headers,
  };

  const fetchOptions: ExtendedRequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  // Cache policy in Next.js 16 should be endpoint-driven (per-request),
  // not a global default in the fetch wrapper.
  // This wrapper only enforces `no-store` for mutations by default.
  const isServer = typeof window === 'undefined';

  if (options?.next) {
    fetchOptions.next = options.next;
  }

  if (options?.cache) {
    fetchOptions.cache = options.cache;
  } else if (method !== 'GET') {
    fetchOptions.cache = 'no-store';
  } else if (!isServer) {
    // Client-side defaults remain fresh unless explicitly cached.
    fetchOptions.cache = 'no-store';
  }

  if (body !== undefined) {
    if (body instanceof FormData) {
      fetchOptions.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }
  }

  try {
    const fullUrl = resolveApiUrl(url);
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

    // Normalizing response with metadata if missing
    if (data && !('metaData' in data)) {
      return {
        metaData: {
          status: 'success',
          message: 'Data received',
          AppStatusCode: response.status,
          timestamp: new Date().toISOString(),
        },
        data: data as T,
      } as ApiResponse<T>;
    }

    if (data?.metaData?.status === 'error') {
      throw new ApiError({
        response: {
          AppStatusCode: data?.metaData?.AppStatusCode || response.status || 400,
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

    if (error instanceof ApiError) throw error;

    const message = error instanceof Error && error.name === 'AbortError'
      ? getNetworkError('timeout')
      : getNetworkError('network');

    throw new ApiError({
      response: {
        AppStatusCode: 500,
        _data: null,
        ok: false,
        message,
        errors: null,
      },
    });
  }
}

export const fetchApi = {
  get: <T>(url: string, options?: RequestOptions) => request<T>(url, 'GET', undefined, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>(url, 'POST', body, options),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>(url, 'PUT', body, options),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>(url, 'PATCH', body, options),
  delete: <T>(url: string, options?: RequestOptions) => request<T>(url, 'DELETE', undefined, options),
};
