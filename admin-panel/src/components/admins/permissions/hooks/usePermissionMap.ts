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


