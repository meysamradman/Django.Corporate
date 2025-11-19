'use client'

import { fetchApi } from '@/core/config/fetch'

export type PermissionMapResponse = {
  all_permissions: {
    permissions: Record<
      string,
      {
        id: string
        module: string
        action: string
        display_name: string
        description: string
        requires_superadmin: boolean
      }
    >
    modules: string[]
  }
  user_permissions: string[]
  is_superadmin: boolean
}

export const permissionApi = {
  async getMap(options?: { cache?: RequestCache; revalidate?: number | false }) {
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


