'use client'

import { fetchApi } from '@/core/config/fetch'
import { PermissionMapResponse } from '@/types/auth/permission'

export const permissionApi = {
  async getMap(options?: {}) {
    const res = await fetchApi.get<PermissionMapResponse>('/admin/permissions/map/', options)
    return res.data
  },
  async check(permissions: string[]) {
    const res = await fetchApi.post<{ results: Record<string, boolean>; has_all: boolean; has_any: boolean }>(
      '/admin/permissions/check/',
      { permissions },
    )
    return res.data
  },
}


