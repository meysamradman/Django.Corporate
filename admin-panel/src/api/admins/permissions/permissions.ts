'use client'

import { api } from '@/core/config/api';
import type { PermissionMapResponse } from '@/types/auth/permission'
import { adminEndpoints } from '@/core/config/adminEndpoints';

export const permissionApi = {
  async getMap(options?: {}) {
    const res = await api.get<PermissionMapResponse>(adminEndpoints.permissionsMap(), options)
    return res.data
  },
  async check(permissions: string[]) {
    const res = await api.post<{ results: Record<string, boolean>; has_all: boolean; has_any: boolean }>(
      adminEndpoints.permissionsCheck(),
      { permissions },
    )
    return res.data
  },
}


