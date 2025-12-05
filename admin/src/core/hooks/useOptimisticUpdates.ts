'use client';

import { useQueryClient } from '@tanstack/react-query';
import { showErrorToast, showSuccessToast } from '@/core/config/errorHandler';

export const useOptimisticUpdate = () => {
  const queryClient = useQueryClient();

  const optimisticUpdate = <T>(
    queryKey: string[],
    updateFn: (oldData: T | undefined) => T,
    mutationFn: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: unknown) => void;
      successMessage?: string;
      errorMessage?: string;
    }
  ) => {
    queryClient.cancelQueries({ queryKey });

    const previousData = queryClient.getQueryData<T>(queryKey);

    queryClient.setQueryData<T>(queryKey, updateFn);

    return mutationFn()
      .then((data) => {
        queryClient.setQueryData<T>(queryKey, data);
        options?.onSuccess?.(data);
        if (options?.successMessage) {
          showSuccessToast(options.successMessage);
        }
        return data;
      })
      .catch((error) => {
        queryClient.setQueryData<T>(queryKey, previousData);
        options?.onError?.(error);
        if (options?.errorMessage) {
          showErrorToast(error, options.errorMessage);
        }
        throw error;
      });
  };

  return { optimisticUpdate };
}; 