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
    // Cancel any outgoing refetches
    queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousData = queryClient.getQueryData<T>(queryKey);

    // Optimistically update to the new value
    queryClient.setQueryData<T>(queryKey, updateFn);

    // Return a promise that resolves to the new data
    return mutationFn()
      .then((data) => {
        // Update with the actual data from the server
        queryClient.setQueryData<T>(queryKey, data);
        options?.onSuccess?.(data);
        if (options?.successMessage) {
          showSuccessToast(options.successMessage);
        }
        return data;
      })
      .catch((error) => {
        // If the mutation fails, use the context returned from onMutate to roll back
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