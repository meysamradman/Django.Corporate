import type { ApiResponse } from '../../types/api';
import { ApiError } from '../../types/api';
import { getCsrfHeaders, sessionManager } from '../auth/session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const isDevelopment = import.meta.env.DEV;

async function baseFetch<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown> | null,
  credentials: RequestCredentials = 'include'
): Promise<ApiResponse<T>> {
  const baseUrl = isDevelopment && url.startsWith('/api') ? '' : API_BASE_URL;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

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
    
    // Log Set-Cookie headers for login requests
    if (import.meta.env.DEV && method === 'POST' && url.includes('login')) {
      const setCookieHeaders = response.headers.get('set-cookie');
      console.log('[fetchApi] Login response Set-Cookie headers:', setCookieHeaders);
      console.log('[fetchApi] All response headers:', Object.fromEntries(response.headers.entries()));
    }
    
    const contentType = response.headers.get('content-type');
    const data: ApiResponse<T> | null = contentType?.includes('application/json') 
      ? await response.json() 
      : null;

    if (!response.ok) {
      const statusCode = data?.metaData?.AppStatusCode || response.status;
      
      // Handle 401 Unauthorized - session expired
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
