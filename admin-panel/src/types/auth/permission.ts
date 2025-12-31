export interface Permission {
  id: number;
  resource: string;
  action: string;
  description?: string;
  is_standalone?: boolean;
  requires_superadmin?: boolean;  // ✅ Added for filtering
}

export interface PermissionCategory {
  [category: string]: {
    code: string;
    name: string;
  }[];
}

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

export interface PermissionGroup {
  resource: string;
  display_name: string;
  permissions: Permission[];
}

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

export interface RoleListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  is_active?: boolean;
  is_system_role?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface RolePermissionsResponse {
  role_id: number;
  role_name: string;
  permissions: RawPermissionGroupData[];
}

export interface RoleWithPermissions {
  id: number;
  name: string;
  description?: string;
  is_protected: boolean;
  permissions: Permission[];
}

export interface PermissionMapResponse {
  all_permissions: {
    permissions: Record<
      string,
      {
        id: string;
        module: string;
        action: string;
        display_name: string;
        description: string;
        requires_superadmin: boolean;
        is_standalone: boolean;
      }
    >;
    modules: string[];
  };
  user_permissions: string[];
  base_permissions: string[];
  is_superadmin: boolean;
}

export interface UIPermissions {
  canManagePanel: boolean;
  canManagePages: boolean;
  canManageSettings: boolean;
  canManageForms: boolean;
  canManageChatbot: boolean;
  
  canManageAI: boolean;
  canManageAIChat: boolean;
  canManageAIContent: boolean;
  canManageAIImage: boolean;
  canManageAIAudio: boolean;
  canManageAISettings: boolean;
  canManageSharedAISettings: boolean;
  canViewAI: boolean;
  
  canCreateBlog: boolean;
  canUpdateBlog: boolean;
  canDeleteBlog: boolean;
  
  canCreatePortfolio: boolean;
  canUpdatePortfolio: boolean;
  canDeletePortfolio: boolean;
  
  canCreateAdmin: boolean;
  canUpdateAdmin: boolean;
  canDeleteAdmin: boolean;
  
  canCreateUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  
  canReadMedia: boolean;
  canUploadMedia: boolean;
  canUpdateMedia: boolean;
  canDeleteMedia: boolean;
  canManageMedia: boolean;
  canUploadImage: boolean;
  canUploadVideo: boolean;
  canUploadAudio: boolean;
  canUploadDocument: boolean;
  canUpdateImage: boolean;
  canUpdateVideo: boolean;
  canUpdateAudio: boolean;
  canUpdateDocument: boolean;
  canDeleteImage: boolean;
  canDeleteVideo: boolean;
  canDeleteAudio: boolean;
  canDeleteDocument: boolean;
  
  canViewDashboardStats: boolean;
  canViewUsersStats: boolean;
  canViewAdminsStats: boolean;
  canViewContentStats: boolean;
  canViewTicketsStats: boolean;
  canViewEmailsStats: boolean;
  canViewSystemStats: boolean;
  canManageStatistics: boolean;
  canManageAllStats: boolean;
  
  canViewEmail: boolean;
  canManageEmail: boolean;
  canManageTicket: boolean;
  
  canReadRealEstateProperty: boolean;
  canCreateRealEstateProperty: boolean;
  canUpdateRealEstateProperty: boolean;
  canDeleteRealEstateProperty: boolean;
  canReadRealEstateAgent: boolean;
  canCreateRealEstateAgent: boolean;
  canUpdateRealEstateAgent: boolean;
  canDeleteRealEstateAgent: boolean;
  canReadRealEstateAgency: boolean;
  canCreateRealEstateAgency: boolean;
  canUpdateRealEstateAgency: boolean;
  canDeleteRealEstateAgency: boolean;
  canManageRealEstateTypes: boolean;
  canManageRealEstateStates: boolean;
  canManageRealEstateLabels: boolean;
  canManageRealEstateFeatures: boolean;
  canManageRealEstateTags: boolean;
}

export interface PermissionContextValue {
  permissionMap: PermissionMapResponse | null;
  isLoading: boolean;
  error: Error | null;
  hasPermission: (permissionId: string) => boolean;
  hasAnyPermission: (permissionIds: string[]) => boolean;
  hasAllPermissions: (permissionIds: string[]) => boolean;
  check: (permissionId: string) => boolean; // Exact match without wildcards
  canUploadInContext: (context: 'portfolio' | 'blog' | 'media_library' | 'real_estate') => boolean;
  refresh: () => Promise<void>;
  ui: UIPermissions;
}

export interface UserRole {
  id: number;
  name: string;
  permissions?: {
    code: string;
    name: string;
  }[];
}

export type ModuleAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage'
  | 'view'
  | 'list'
  | 'edit'
  | 'change'
  | 'add'
  | 'remove'
  | 'admin';

export interface RoleAssignment {
  roleId: number;
  assigned: boolean;
}