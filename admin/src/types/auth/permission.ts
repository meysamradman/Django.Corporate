// ========================================
// Common Permission Types for Auth System
// Shared between Admin, User, and Role modules
// ========================================

// Basic Permission Interface
export interface Permission {
  id: number;
  resource: string;
  action: string;
  description?: string;
  is_standalone?: boolean;
}

// Permission Category for grouping
export interface PermissionCategory {
  [category: string]: {
    code: string;
    name: string;
  }[];
}

// Basic Role Interface (for admin/user references)
export interface Role {
  id: number;
  public_id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: Record<string, any>;
  level: number;
  is_system_role: boolean;
  is_active: boolean;
  users_count?: number;
  created_at: string;
  updated_at?: string;
}

// Permission Group for display
export interface PermissionGroup {
  resource: string;
  display_name: string;
  permissions: Permission[];
}

// Raw data interfaces for API responses
export interface RawPermissionGroupData {
  resource: string;
  display_name: string;
  permissions: Permission[];
}

export interface BasePermissionDescriptor {
  id: string;
  display_name: string;
  resource?: string;
  action?: string;
  description?: string;
  is_base?: boolean;
}

export interface RawRoleData {
  id: number;
  name: string;
  description?: string;
  is_protected: boolean;
  permissions?: Permission[];
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface RawAdminData {
  roles?: any[];
  [key: string]: unknown;
}

export interface PermissionSummary {
  total_permissions: number | string;
  accessible_modules?: number;
  available_actions?: number;
  access_type: string;
  restrictions?: string;
}

export interface PermissionProfile {
  access_level: "none" | "user" | "admin" | "super_admin";
  permissions?: string[];
  roles?: string[];
  modules?: string[];
  actions?: string[];
  restrictions?: string[];
  special?: string[];
  permission_summary?: PermissionSummary;
  permissions_count?: number | string;
  has_permissions?: boolean;
  base_permissions?: BasePermissionDescriptor[];
}

// API Request/Response Types
export interface RoleListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  is_active?: boolean;
  is_system_role?: boolean;
}

// Role permissions response
export interface RolePermissionsResponse {
  role_id: number;
  role_name: string;
  permissions: RawPermissionGroupData[];
}

// Role with permissions for management pages
export interface RoleWithPermissions {
  id: number;
  name: string;
  description?: string;
  is_protected: boolean;
  permissions: Permission[];
}