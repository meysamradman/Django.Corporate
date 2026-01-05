import { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { env } from '@/core/config/environment';
import { getNetworkError } from '@/core/messages/errors';

async function request<T>(
  url: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  options?: { headers?: Record<string, string>; timeout?: number }
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options?.timeout || 30000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
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
    const fullUrl = url.startsWith('http') ? url : `${env.API_BASE_URL}${url}`;
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
  get: <T>(url: string, options?: any) => request<T>(url, 'GET', undefined, options),
  post: <T>(url: string, body?: any, options?: any) => request<T>(url, 'POST', body, options),
};
