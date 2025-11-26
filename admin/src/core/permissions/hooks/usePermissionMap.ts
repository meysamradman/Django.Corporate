'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { permissionApi } from '@/api/permissions/route'
import type { PermissionSnapshot } from '../types'

export const usePermissionMap = () => {
  const query = useQuery({
    queryKey: ['permission-map'],
    queryFn: async () => {
      // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
      const res = await permissionApi.getMap()
      return res
    },
    staleTime: 0, // Always fetch fresh - no frontend caching
    gcTime: 0, // No cache retention - backend Redis handles caching
  })

  // Normalize data to ensure user_permissions is always an array
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


