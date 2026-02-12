export interface RolePermission {
  id: number;
  resource?: string;
  action?: string;
  display_name: string;
  requires_superadmin?: boolean;
  original_key?: string;
  is_standalone?: boolean;
  permission_category?: string;
}

export interface RolePermissionGroup {
  resource: string;
  display_name?: string;
  permissions: RolePermission[];
}

export interface RolePermissionResource {
  resource: string;
  display_name: string;
  permissions: RolePermission[];
}

export interface BasePermissionRef {
  resource?: string;
  action?: string;
}

export interface SpecificPermissionPayloadItem {
  module: string;
  action: string;
  permission_key?: string;
}
