import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { sessionManager } from '../auth/session';
import { env } from './environment';

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
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (csrfToken && config.method !== 'get') {
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
  (error: AxiosError<ApiResponse<any>>) => {
    if (error.response?.status === 401) {
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
    const response = await axiosInstance.get<ApiResponse<T>>(url, {
      ...config,
      withCredentials: false,
    });
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

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
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
