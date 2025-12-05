import { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from "@/types/api/apiError";
import { csrfTokenStore } from '@/core/auth/csrfToken';
import { env } from '@/core/config/environment';

const isServer = typeof window === 'undefined'; 

if (!env.API_BASE_URL) {
  throw new Error("CRITICAL ERROR: API_BASE_URL is not set in environment configuration.");
}

type RequestOptions = {
    headers?: Record<string, string>;
    cookieHeader?: string;
    useFetchForErrorHandling?: boolean;
    timeout?: number;
};

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('csrftoken=')) {
      return cookie.substring('csrftoken='.length, cookie.length);
    }
    }
  } catch (error) {
  }
  return null;
}

function getAdminSessionId(): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith('sessionid=')) {
        return cookie.substring('sessionid='.length);
      }
    }
  } catch (error) {
  }
  return null;
}

function getCsrfHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const csrfToken = csrfTokenStore.getToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  } else {
    const storedToken = csrfTokenStore.getStoredToken();
    if (storedToken) {
      headers['X-CSRFToken'] = storedToken;
    } else {
      const cookieToken = getCsrfToken();
      if (cookieToken) {
        csrfTokenStore.setToken(cookieToken);
        headers['X-CSRFToken'] = cookieToken;
      }
    }
  }
  return headers;
}

async function baseFetch<T>(
    url: string,
    method: string = 'GET',
    body?: BodyInit | Record<string, unknown> | null,
    options?: RequestOptions
): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeout = options?.timeout || 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
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
    };

    if (body) {
        if (body instanceof FormData) {
            delete headers['Content-Type'];
            fetchOptions.body = body;
        } else {
            fetchOptions.body = JSON.stringify(body);
        }
    }

    fetchOptions.cache = 'no-store';

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
                if (response.ok) {
                     return {
                        metaData: { 
                            status: 'success', 
                            message: `Operation successful (${response.status})`, 
                            AppStatusCode: response.status, 
                            timestamp: new Date().toISOString() 
                        },
                        data: null as T
                     };
                }
            }
        } catch (jsonError) {
            try { 
                errorText = await response.text(); 
            } catch {}
            if (!response.ok) {
                throw new ApiError({
                    response: { 
                        AppStatusCode: response.status, 
                        _data: null, 
                        ok: false, 
                        message: `Request failed: ${response.status}. Response body parsing error. ${errorText.substring(0,100)}`, 
                        errors: null 
                    } 
                });
            }
             return { 
                metaData: { 
                    status: 'success', 
                    message: `OK (${response.status}), but response body parsing failed.`, 
                    AppStatusCode: response.status, 
                    timestamp: new Date().toISOString() 
                }, 
                data: null as T 
             };
        }

        if (!response.ok) {
            if (data && typeof data === 'object') {
                if (data.data || data.errors) {
                }
            }
            
            throw new ApiError({
                response: {
                    AppStatusCode: data?.metaData?.AppStatusCode || response.status,
                    _data: data,
                    ok: false,
                    message: data?.metaData?.message || errorText || `Error: ${response.status}`,
                    errors: data?.errors || data?.data || null
                }
            });
        }

         if (response.ok && (data === null || !contentType?.includes('application/json'))) {
             return {
                 metaData: {
                     status: 'success',
                     message: `OK (${response.status}), but received null/empty/non-JSON data.`,
                     AppStatusCode: response.status,
                     timestamp: new Date().toISOString() 
                 },
                 data: null as T
              };
        }

        if (response.ok && data && typeof data === 'object') {
            if (!('metaData' in data)) {
                const responseWithMeta: ApiResponse<T> = {
                    metaData: {
                        status: 'success',
                        message: `Data received successfully (${response.status})`,
                        AppStatusCode: response.status,
                        timestamp: new Date().toISOString() 
                    },
                    data: data as T
                };
                
                if (data && typeof data === 'object' && 'pagination' in data) {
                    (responseWithMeta as any).pagination = (data as any).pagination;
                }
                
                return responseWithMeta;
            }
            
            return data as ApiResponse<T>;
        }

        if (response.ok && (!data || typeof data !== 'object')) {
            return {
                metaData: {
                    status: 'success',
                    message: `OK (${response.status})`,
                    AppStatusCode: response.status,
                    timestamp: new Date().toISOString()
                },
                data: null as T
            };
        }

        return data as ApiResponse<T>;

    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof ApiError) {
            throw error;
        } else if (error instanceof Error && error.name === 'AbortError') {
            throw new ApiError({
                response: {
                    AppStatusCode: 504,
                    _data: null,
                    ok: false,
                    message: 'زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.',
                    errors: null
                }
            });
        } else {
            throw new ApiError({
                response: {
                    AppStatusCode: 503,
                    _data: null,
                    ok: false,
                    message: error instanceof Error ? error.message || 'Unknown error' : 'Network error or unknown issue occurred',
                    errors: null
                }
            });
        }
    }
}

async function downloadFile(
    url: string,
    filename: string,
    method: string = 'GET',
    body?: BodyInit | Record<string, unknown> | null,
    options?: RequestOptions
): Promise<void> {
    if (method === 'GET' && !body && !options?.useFetchForErrorHandling) {
        let fullUrl = url;
        if (!url.startsWith(env.API_BASE_URL)) {
            fullUrl = `${env.API_BASE_URL}${url}`;
        }
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.src = fullUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
            try {
                document.body.removeChild(iframe);
            } catch (e) {
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
            } else {
                const errorText = await response.text();
                if (errorText) {
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson?.metaData?.message || errorJson?.message || errorMessage;
                    } catch {
                        errorMessage = errorText.substring(0, 200) || errorMessage;
                    }
                }
            }
        } catch (parseError) {
        }
        
        throw new ApiError({
            response: {
                AppStatusCode: response.status,
                _data: null,
                ok: false,
                message: errorMessage,
                errors: null
            }
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
    get: async <T>(url: string, options?: Omit<RequestOptions, 'headers'>): Promise<ApiResponse<T>> => {
        return baseFetch<T>(url, 'GET', undefined, options);
    },
    post: async <T>(url: string, body?: BodyInit | Record<string, unknown> | null, options?: Omit<RequestOptions, 'headers'>): Promise<ApiResponse<T>> => {
        return baseFetch<T>(url, 'POST', body, options);
    },
    put: async <T>(url: string, body?: BodyInit | Record<string, unknown> | null, options?: Omit<RequestOptions, 'headers'>): Promise<ApiResponse<T>> => {
        return baseFetch<T>(url, 'PUT', body, options);
    },
    patch: async <T>(url: string, body?: BodyInit | Record<string, unknown> | null, options?: Omit<RequestOptions, 'headers'>): Promise<ApiResponse<T>> => {
        return baseFetch<T>(url, 'PATCH', body, options);
    },
    delete: async <T>(url: string, options?: Omit<RequestOptions, 'headers'>): Promise<ApiResponse<T>> => {
        return baseFetch<T>(url, 'DELETE', undefined, options);
    },
    downloadFile: async (url: string, filename: string, method: string = 'GET', body?: BodyInit | Record<string, unknown> | null, options?: RequestOptions): Promise<void> => {
        return downloadFile(url, filename, method, body, options);
    }
};