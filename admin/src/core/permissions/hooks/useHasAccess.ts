'use client'

import { useMemo } from 'react'
import { usePermissionMap } from './usePermissionMap'

/**
 * Simple, fast permission checker based on cached map.
 * Example: useHasAccess('media.upload') or useHasAccess(['panel.update','media.upload'])
 */
export const useHasAccess = (permission: string | string[]) => {
  const { data } = usePermissionMap()

  return useMemo(() => {
    if (!data) return false
    if (data.isSuper) return true
    if (!data.user || !Array.isArray(data.user)) return false
    const list = Array.isArray(permission) ? permission : [permission]
    return list.every((pid) => data.user.includes(pid))
  }, [data, permission])
}


