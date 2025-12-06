'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/core/config/fetch';

export function useCreate<TData, TVariables>(
  endpoint: string,
  queryKey: string[],
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: TData) => void;
    onError?: (error: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TVariables) => {
      const response = await fetchApi.post<TData>(endpoint, data as any, {
        successMessage: options?.successMessage,
        errorMessage: options?.errorMessage,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

export function useUpdate<TData, TVariables>(
  endpoint: string | ((id: number | string) => string),
  queryKey: string[],
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: TData) => void;
    onError?: (error: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: TVariables }) => {
      const url = typeof endpoint === 'function' ? endpoint(id) : `${endpoint}${id}/`;
      const response = await fetchApi.patch<TData>(url, data as any, {
        successMessage: options?.successMessage,
        errorMessage: options?.errorMessage,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

export function useDelete(
  endpoint: string | ((id: number | string) => string),
  queryKey: string[],
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      const url = typeof endpoint === 'function' ? endpoint(id) : `${endpoint}${id}/`;
      await fetchApi.delete(url, {
        successMessage: options?.successMessage,
        errorMessage: options?.errorMessage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}

export function useSilentMutation<TData, TVariables>(
  endpoint: string,
  queryKey: string[],
  method: 'POST' | 'PATCH' | 'DELETE' = 'PATCH'
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TVariables) => {
      const methodMap = {
        POST: fetchApi.post<TData>,
        PATCH: fetchApi.patch<TData>,
        DELETE: fetchApi.delete<TData>,
      };

      const response = await methodMap[method](endpoint, data as any);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
