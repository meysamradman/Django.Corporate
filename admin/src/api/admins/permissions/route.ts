'use client'

import { fetchApi } from '@/core/config/fetch'
import { PermissionMapResponse } from '@/types/auth/permission'
import { adminEndpoints } from '@/core/config/adminEndpoints';

export const permissionApi = {
  async getMap(options?: {}) {
    const res = await fetchApi.get<PermissionMapResponse>(adminEndpoints.permissionsMap(), options)
    return res.data
  },
  async check(permissions: string[]) {
    const res = await fetchApi.post<{ results: Record<string, boolean>; has_all: boolean; has_any: boolean }>(
      adminEndpoints.permissionsCheck(),
      { permissions },
    )
    return res.data
  },
}


