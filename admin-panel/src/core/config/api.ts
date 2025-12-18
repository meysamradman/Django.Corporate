import type { ApiResponse } from '../../types/api';
import { ApiError } from '../../types/api';
import { getCsrfHeaders, sessionManager } from '../auth/session';
import { env } from './environment';

async function baseFetch<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown> | null,
  credentials: RequestCredentials = 'include'
): Promise<ApiResponse<T>> {
  let fullUrl = url;
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    fullUrl = url;
  } else if (url.startsWith('/api')) {
    const urlWithoutApi = url.replace(/^\/api/, '');
    fullUrl = `${env.API_URL}${urlWithoutApi}`;
  } else {
    fullUrl = `${env.API_URL}${url.startsWith('/') ? url : `/${url}`}`;
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(credentials === 'include' ? getCsrfHeaders() : {}),
    },
    credentials,
    cache: 'no-store',
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(fullUrl, options);
    
    const contentType = response.headers.get('content-type');
    const data: ApiResponse<T> | null = contentType?.includes('application/json') 
      ? await response.json() 
      : null;

    if (!response.ok) {
      const statusCode = data?.metaData?.AppStatusCode || response.status;
      
      if (statusCode === 401 || response.status === 401) {
        if (typeof window !== 'undefined') {
          sessionManager.handleExpiredSession();
        }
      }
      
      throw new ApiError({
        response: {
          AppStatusCode: statusCode,
          _data: data,
          ok: false,
          message: data?.metaData?.message || `Error: ${response.status}`,
          errors: data?.errors || null,
        },
      });
    }

    if (!data || !('metaData' in data)) {
      if (response.ok && data && typeof data === 'object') {
        return {
          metaData: {
            status: 'success',
            message: `OK (${response.status})`,
            AppStatusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          data: data as T,
        };
      }
      
      if (response.ok && data === null) {
        throw new ApiError({
          response: {
            AppStatusCode: response.status,
            _data: null,
            ok: false,
            message: 'Empty response from server',
            errors: null,
          },
        });
      }
      
      return {
        metaData: {
          status: 'success',
          message: `OK (${response.status})`,
          AppStatusCode: response.status,
          timestamp: new Date().toISOString(),
        },
        data: (data as T) ?? (null as unknown as T),
      };
    }

    if (data.data === null || (data.data === undefined && typeof data.data !== 'object')) {
      throw new ApiError({
        response: {
          AppStatusCode: data.metaData?.AppStatusCode || response.status,
          _data: data,
          ok: false,
          message: data.metaData?.message || 'Response data is null',
          errors: data.errors || null,
        },
      });
    }

    return data as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError({
      response: {
        AppStatusCode: 503,
        _data: null,
        ok: false,
        message: error instanceof Error ? error.message : 'Network error',
        errors: null,
      },
    });
  }
}

export const api = {
  get: <T>(url: string): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'GET', undefined, 'include');
  },

  post: <T>(url: string, body?: Record<string, unknown> | null): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'POST', body, 'include');
  },

  put: <T>(url: string, body?: Record<string, unknown> | null): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'PUT', body, 'include');
  },

  patch: <T>(url: string, body?: Record<string, unknown> | null): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'PATCH', body, 'include');
  },

  delete: <T>(url: string): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'DELETE', undefined, 'include');
  },

  getPublic: <T>(url: string): Promise<ApiResponse<T>> => {
    return baseFetch<T>(url, 'GET', undefined, 'omit');
  },
};
