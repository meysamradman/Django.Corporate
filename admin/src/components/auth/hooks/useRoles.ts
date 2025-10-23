'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roleApi } from '@/api/roles/route'
import { RoleListParams } from '@/types/auth/permission'
import { toast } from '@/components/elements/Sonner';
import { getPermissionTranslation } from '@/core/messages/permissions';

// Simple translation function for role errors
const translateRoleError = (message: string): string => {
  if (!message) return message;
  
  // Use centralized translation function
  const translated = getPermissionTranslation(message, 'roleError');
  if (translated !== message) {
    return translated;
  }
  
  // Return original message if no translation found
  return message;
};

// Simple translation function for success messages
const translateRoleSuccess = (message: string): string => {
  if (!message) return message;
  
  // Use centralized translation function
  const translated = getPermissionTranslation(message, 'roleSuccess');
  if (translated !== message) {
    return translated;
  }
  
  // Return original message if no translation found
  return message;
};

// New: Hook to fetch permissions
export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await roleApi.getPermissions()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// New: Hook to fetch base permissions
export const useBasePermissions = () => {
  return useQuery({
    queryKey: ['base-permissions'],
    queryFn: async () => {
      const response = await roleApi.getBasePermissions()
      return response.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - longer cache for base permissions
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

export const useRoles = (params: RoleListParams = {}) => {
  return useQuery({
    queryKey: ['roles', params.search, params.page, params.size, params.order_by, params.order_desc, params.is_active, params.is_system_role],
    queryFn: async () => {
      const response = await roleApi.getRoleList(params)
      return response
    },
    staleTime: 0, // Always fetch fresh data
  })
}

export const useRole = (id: number) => {
  return useQuery({
    queryKey: ['role', id],
    queryFn: async () => {
      const response = await roleApi.getRoleById(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: roleApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('نقش با موفقیت ایجاد شد')
    },
    onError: (error: any) => {
      // Check if it's a validation error from backend
      if (error?.metaData?.message) {
        const translatedMessage = translateRoleError(error.metaData.message);
        toast.error(translatedMessage)
      } else if (error?.message) {
        toast.error(error.message)
      } else {
        toast.error('خطا در ایجاد نقش')
      }
    },
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => roleApi.updateRole(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['role', id] })
      toast.success('نقش با موفقیت بروزرسانی شد')
    },
    onError: (error: any) => {
      // Check if it's a validation error from backend
      if (error?.metaData?.message) {
        const translatedMessage = translateRoleError(error.metaData.message);
        toast.error(translatedMessage)
      } else if (error?.message) {
        toast.error(error.message)
      } else {
        toast.error('خطا در بروزرسانی نقش')
      }
    },
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: roleApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('نقش با موفقیت حذف شد')
    },
    onError: (error: any) => {
      // Check if it's a validation error from backend
      if (error?.metaData?.message) {
        const translatedMessage = translateRoleError(error.metaData.message);
        toast.error(translatedMessage)
      } else if (error?.message) {
        toast.error(error.message)
      } else {
        toast.error('خطا در حذف نقش')
      }
    },
  })
}

export const useBulkDeleteRoles = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: roleApi.bulkDeleteRoles,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (response?.data?.deleted_count) {
        const successMessage = translateRoleSuccess(
          `Successfully deleted ${response.data.deleted_count} admin roles`
        );
        toast.success(successMessage)
      } else {
        toast.success('نقش‌ها با موفقیت حذف شدند')
      }
    },
    onError: (error: any) => {
      // Check if it's a validation error from backend
      if (error?.metaData?.message) {
        const translatedMessage = translateRoleError(error.metaData.message);
        toast.error(translatedMessage)
      } else if (error?.message) {
        toast.error(error.message)
      } else {
        toast.error('خطا در حذف نقش‌ها')
      }
    },
  })
}

export const useUpdateRoleStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => 
      roleApi.updateRoleStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('وضعیت نقش با موفقیت تغییر کرد')
    },
    onError: (error: any) => {
      // Check if it's a validation error from backend
      if (error?.metaData?.message) {
        const translatedMessage = translateRoleError(error.metaData.message);
        toast.error(translatedMessage)
      } else if (error?.message) {
        toast.error(error.message)
      } else {
        toast.error('خطا در تغییر وضعیت نقش')
      }
    },
  })
}