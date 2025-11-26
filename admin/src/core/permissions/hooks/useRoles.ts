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
    staleTime: 0, // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
    gcTime: 0, // No cache retention
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
    staleTime: 0, // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
    gcTime: 0, // No cache retention
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
    staleTime: 0, // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
    gcTime: 0, // No cache retention
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: roleApi.createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      // ✅ CRITICAL: Invalidate permission-map to refresh permissions
      await queryClient.invalidateQueries({ queryKey: ['permission-map'] })
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
    onSuccess: async (response, { id }) => {
      // ✅ Invalidate role-related queries
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      await queryClient.invalidateQueries({ queryKey: ['role', id] })
      await queryClient.invalidateQueries({ queryKey: ['permissions'] })
      await queryClient.refetchQueries({ queryKey: ['role', id] })
      
      // ✅ CRITICAL: Invalidate permission-map to refresh permissions for all users with this role
      await queryClient.invalidateQueries({ queryKey: ['permission-map'] })
      
      toast.success('نقش با موفقیت بروزرسانی شد')
    },
    onError: (error: any) => {
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      // ✅ CRITICAL: Invalidate permission-map to refresh permissions for users who had this role
      await queryClient.invalidateQueries({ queryKey: ['permission-map'] })
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
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      // ✅ CRITICAL: Invalidate permission-map to refresh permissions for users who had these roles
      await queryClient.invalidateQueries({ queryKey: ['permission-map'] })
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      // ✅ CRITICAL: Invalidate permission-map to refresh permissions when role status changes
      await queryClient.invalidateQueries({ queryKey: ['permission-map'] })
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

