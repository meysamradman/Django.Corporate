import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { permissionApi } from '@/api/admins/permissions/permissions'
import type { PermissionSnapshot } from '../types'

export const usePermissionMap = () => {
  const query = useQuery({
    queryKey: ['permission-map'],
    queryFn: async () => {
      const res = await permissionApi.getMap()
      return res
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid rate limiting
    refetchOnMount: false, // Don't refetch - use existing data from PermissionProvider
    refetchOnReconnect: false, // Don't refetch on reconnect to avoid rate limiting
    retry: false, // Don't retry on error to avoid rate limiting (429 errors)
    retryOnMount: false, // Don't retry on mount if there was an error
  })

  const normalizedData = useMemo<PermissionSnapshot | undefined>(() => {
    if (!query.data) return undefined
    return {
      all: query.data.all_permissions,
      user: Array.isArray(query.data.user_permissions) 
        ? query.data.user_permissions 
        : [],
      base: Array.isArray(query.data.base_permissions)
        ? query.data.base_permissions
        : [],
      isSuper: query.data.is_superadmin,
    }
  }, [query.data])

  return {
    ...query,
    data: normalizedData,
  }
}

