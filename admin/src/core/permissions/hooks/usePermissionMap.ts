'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { permissionApi } from '@/api/permissions/route'
import type { PermissionSnapshot } from '../types'

export const usePermissionMap = () => {
  const query = useQuery({
    queryKey: ['permission-map'],
    queryFn: async () => {
      const res = await permissionApi.getMap({ cache: 'no-store', revalidate: false })
      return res
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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


