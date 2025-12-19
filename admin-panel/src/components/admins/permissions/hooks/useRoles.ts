import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roleApi } from '@/api/admins/roles/roles'
import type { RoleListParams } from '@/types/auth/permission'
import { toast } from '@/components/elements/Sonner';
import { getPermissionTranslation } from '@/core/messages/permissions';

const translateRoleError = (message: string): string => {
  if (!message) return message;
  
  const translated = getPermissionTranslation(message, 'roleError');
  if (translated !== message) {
    return translated;
  }
  
  return message;
};

const translateRoleSuccess = (message: string): string => {
  if (!message) return message;
  
  const translated = getPermissionTranslation(message, 'roleSuccess');
  if (translated !== message) {
    return translated;
  }
  
  return message;
};

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await roleApi.getPermissions()
      return response.data
    },
    staleTime: 0,
    gcTime: 0,
  })
}

export const useBasePermissions = () => {
  return useQuery({
    queryKey: ['base-permissions'],
    queryFn: async () => {
      const response = await roleApi.getBasePermissions()
      return response.data
    },
    staleTime: 0,
    gcTime: 0,
  })
}

export const useRoles = (params: RoleListParams = {}) => {
  return useQuery({
    queryKey: ['roles', params.search, params.page, params.size, params.order_by, params.order_desc, params.is_active, params.is_system_role],
    queryFn: async () => {
      const response = await roleApi.getRoleList(params)
      return response
    },
    staleTime: 0,
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
    staleTime: 0,
    gcTime: 0,
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: roleApi.createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      await queryClient.invalidateQueries({ queryKey: ['permission-map'] })
      toast.success('نقش با موفقیت ایجاد شد')
    },
    onError: (error: any) => {
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
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      await queryClient.invalidateQueries({ queryKey: ['role', id] })
      await queryClient.invalidateQueries({ queryKey: ['permissions'] })
      await queryClient.refetchQueries({ queryKey: ['role', id] })
      
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
      await queryClient.invalidateQueries({ queryKey: ['permission-map'] })
      toast.success('نقش با موفقیت حذف شد')
    },
    onError: (error: any) => {
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
      await queryClient.invalidateQueries({ queryKey: ['permission-map'] })
      toast.success('وضعیت نقش با موفقیت تغییر کرد')
    },
    onError: (error: any) => {
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

