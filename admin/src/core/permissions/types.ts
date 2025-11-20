export type PermissionMeta = {
  id: string
  module: string
  action: string
  display_name: string
  description: string
  requires_superadmin: boolean
}

export type PermissionMap = {
  permissions: Record<string, PermissionMeta>
  modules: string[]
}

export type PermissionSnapshot = {
  all: PermissionMap
  user: string[]
  base: string[]  // Base permissions (رایگان برای همه ادمین‌ها)
  isSuper: boolean
}


