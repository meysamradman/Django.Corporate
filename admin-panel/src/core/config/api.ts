import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { csrfManager, sessionManager } from '../auth/session';
import { env } from './environment';
import { handleRateLimitError } from '../utils/rateLimitHandler';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuthRedirect?: boolean;
  _retryCount?: number;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const csrfToken = csrfManager.getToken();
    const method = config.method?.toLowerCase();
    const isUnsafeMethod = !!method && !['get', 'head', 'options', 'trace'].includes(method);

    if (csrfToken && isUnsafeMethod) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    if (!response.data || !('metaData' in response.data)) {
      const wrappedResponse: ApiResponse<any> = {
        metaData: {
          status: 'success',
          message: 'OK',
          AppStatusCode: response.status,
          timestamp: new Date().toISOString(),
        },
        data: response.data,
      };
      return { ...response, data: wrappedResponse };
    }

    return response;
  },
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as ApiRequestConfig;
    const endpoint = originalRequest?.url || 'unknown';
    const method = originalRequest?.method?.toLowerCase();
    const canRetry = method === 'get' || method === 'head';

    if (error.response?.status === 429 && originalRequest && canRetry) {
      const retryAfterHeader = error.response.headers['retry-after'];
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;

      handleRateLimitError(endpoint, retryAfter);

      originalRequest._retryCount = originalRequest._retryCount || 0;

      if (originalRequest._retryCount < MAX_RETRY_ATTEMPTS) {
        originalRequest._retryCount++;

        const delay = RETRY_DELAY_BASE * Math.pow(2, originalRequest._retryCount - 1);

        await new Promise(resolve => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
    }

    if (error.response?.status === 401 && !originalRequest?.skipAuthRedirect) {
      sessionManager.handleExpiredSession();
    }

    const apiError = new ApiError({
      response: {
        AppStatusCode: error.response?.data?.metaData?.AppStatusCode || error.response?.status || 503,
        _data: error.response?.data,
        ok: false,
        message: error.response?.data?.metaData?.message || error.message || 'Network error',
        errors: error.response?.data?.errors || null,
      },
    });

    return Promise.reject(apiError);
  }
);

export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data;
  },

  getPublic: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const publicConfig: ApiRequestConfig = {
      ...config,
      withCredentials: false,
      skipAuthRedirect: true,
    };

    const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.get<ApiResponse<T>>(url, publicConfig);
    return response.data;
  },

  upload: async <T>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  download: async (
    url: string,
    filename: string,
    onDownloadProgress?: (progressEvent: any) => void
  ): Promise<void> => {
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
      onDownloadProgress,
    });

    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      const text = await response.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.metaData?.message || 'Download failed');
      } catch (e) {
        throw new Error('Server returned an error instead of a file.');
      }
    }

    const blob = new Blob([response.data], { type: contentType || 'application/octet-stream' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);
  },
};

export { axiosInstance };

export const createCancelToken = () => {
  const source = axios.CancelToken.source();
  return {
    token: source.token,
    cancel: source.cancel,
  };
};

export const isCancel = axios.isCancel;
