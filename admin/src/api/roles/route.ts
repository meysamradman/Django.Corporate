'use client'

import { fetchApi } from '@/core/config/fetch'
import { ApiResponse } from '@/types/api/apiResponse'
import { Role, PermissionGroup, RoleListParams } from '@/types/auth/permission'
import { convertToLimitOffset } from '@/core/utils/pagination'



export interface RoleListResponse {
  data: Role[]
  pagination: {
    count: number
    next: string | null
    previous: string | null
    page_size: number
    current_page: number
    total_pages: number
  }
}

// Backend pagination interface
interface BackendPagination {
  count?: number;
  next?: string | null;
  previous?: string | null;
  page_size?: number;
}

// Backend response interface
interface BackendResponse<T> {
  metaData: {
    status: string;
    message: string;
    AppStatusCode: number;
    timestamp: string;
  };
  pagination: BackendPagination;
  data: T[];
}

export const roleApi = {
  getRoleList: async (params: RoleListParams = {}): Promise<ApiResponse<Role[]>> => {
    const searchParams = new URLSearchParams()
    
    if (params.search && params.search.trim() !== '') {
      searchParams.append('search', params.search.trim())
    }
    if (params.page) {
      const { limit, offset } = convertToLimitOffset(params.page, params.size || 10);
      searchParams.append('limit', limit.toString());
      searchParams.append('offset', offset.toString());
    }
    if (params.size) searchParams.append('size', params.size.toString())
    if (params.order_by) searchParams.append('order_by', params.order_by)
    if (params.order_desc !== undefined) searchParams.append('order_desc', params.order_desc.toString())
    if (params.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
    if (params.is_system_role !== undefined) searchParams.append('is_system_role', params.is_system_role.toString())
    
    const queryString = searchParams.toString()
    const url = `/admin/roles/${queryString ? `?${queryString}` : ''}`
    
    const response = await fetchApi.get<BackendResponse<Role>>(url)
    
    // Parse pagination from the response
    const backendPagination = response.pagination || {} as BackendPagination;
    
    // Calculate total pages based on count and page_size
    const count = ('count' in backendPagination && typeof backendPagination.count === 'number') ? backendPagination.count : (Array.isArray(response.data) ? response.data.length : 0);
    const pageSize = ('page_size' in backendPagination && typeof backendPagination.page_size === 'number') ? backendPagination.page_size : (params?.size || 10);
    const totalPages = Math.ceil(count / pageSize);
    
    // Return response with proper pagination
    return {
      metaData: response.metaData,
      data: Array.isArray(response.data) ? response.data : [],
      pagination: {
        count: count,
        next: ('next' in backendPagination && typeof backendPagination.next === 'string') ? backendPagination.next : null,
        previous: ('previous' in backendPagination && typeof backendPagination.previous === 'string') ? backendPagination.previous : null,
        page_size: pageSize,
        current_page: params?.page || 1,
        total_pages: totalPages
      }
    } as ApiResponse<Role[]>
  },

  getRoleById: async (id: number): Promise<ApiResponse<Role>> => {
    return fetchApi.get<Role>(`/admin/roles/${id}/`)
  },

  createRole: async (data: { name: string; description?: string; permission_ids?: number[] }): Promise<ApiResponse<Role>> => {
    // Transform permission_ids to the format backend expects
    const { permission_ids, ...roleData } = data;
    
    let permissions = {};
    
    // Convert permission_ids to modules and actions
    if (permission_ids && permission_ids.length > 0) {
      // Get permissions data to map IDs to modules/actions
      const permissionsResponse = await fetchApi.get<PermissionGroup[]>('/admin/roles/permissions/');
      const permissionGroups = permissionsResponse.data;
      
      const modules = new Set<string>();
      const actions = new Set<string>();
      
      // Find selected permissions and extract modules/actions
      permissionGroups.forEach(group => {
        group.permissions.forEach(permission => {
          if (permission_ids.includes(permission.id)) {
            modules.add(permission.resource);
            actions.add(permission.action.toLowerCase());
          }
        });
      });
      
      permissions = {
        modules: Array.from(modules),
        actions: Array.from(actions)
      };
    }
    
    const requestData = {
      ...roleData,
      // Add required display_name field
      display_name: data.name,
      // Backend expects permissions as JSON object
      permissions
    };
    
    return fetchApi.post<Role>('/admin/roles/', requestData)
  },

  updateRole: async (id: number, data: { name?: string; description?: string; permission_ids?: number[] }): Promise<ApiResponse<Role>> => {
    // Transform permission_ids to the format backend expects
    const { permission_ids, ...roleData } = data;
    
    let updateData: any = { ...roleData };
    
    // Convert permission_ids to modules and actions if provided
    if (permission_ids !== undefined) {
      let permissions = {};
      
      if (permission_ids.length > 0) {
        // Get permissions data to map IDs to modules/actions
        const permissionsResponse = await fetchApi.get<PermissionGroup[]>('/admin/roles/permissions/');
        const permissionGroups = permissionsResponse.data;
        
        const modules = new Set<string>();
        const actions = new Set<string>();
        
        // Find selected permissions and extract modules/actions
        permissionGroups.forEach(group => {
          group.permissions.forEach(permission => {
            if (permission_ids.includes(permission.id)) {
              modules.add(permission.resource);
              actions.add(permission.action.toLowerCase());
            }
          });
        });
        
        permissions = {
          modules: Array.from(modules),
          actions: Array.from(actions)
        };
      }
      
      updateData.permissions = permissions;
    }
    
    return fetchApi.put<Role>(`/admin/roles/${id}/`, updateData)
  },

  deleteRole: async (id: number): Promise<ApiResponse<null>> => {
    return fetchApi.delete<null>(`/admin/roles/${id}/`)
  },

  bulkDeleteRoles: async (ids: number[]): Promise<ApiResponse<{ deleted_count: number }>> => {
    return fetchApi.post<{ deleted_count: number }>('/admin/roles/bulk-delete/', { ids })
  },

  updateRoleStatus: async (id: number, is_active: boolean): Promise<ApiResponse<Role>> => {
    return fetchApi.patch<Role>(`/admin/roles/${id}/status/`, { is_active })
  },

  // Get all permissions grouped by resource
  getPermissions: async (): Promise<ApiResponse<PermissionGroup[]>> => {
    return fetchApi.get<PermissionGroup[]>('/admin/roles/permissions/')
  },

  // Get base permissions that all admins have
  getBasePermissions: async (): Promise<ApiResponse<any[]>> => {
    return fetchApi.get<any[]>('/admin/roles/base_permissions/')
  },

  // Get permissions for a specific role
  getRolePermissions: async (roleId: number): Promise<ApiResponse<{role_id: number; role_name: string; permissions: Record<string, any>}>> => {
    return fetchApi.get<{role_id: number; role_name: string; permissions: Record<string, any>}>(`/admin/roles/${roleId}/role_permissions/`)
  },

  // Setup default admin roles
  setupDefaultRoles: async (forceUpdate: boolean = false): Promise<ApiResponse<any>> => {
    return fetchApi.post<any>('/admin/roles/setup_default_roles/', { force_update: forceUpdate })
  },

  // Get roles summary
  getRolesSummary: async (): Promise<ApiResponse<any>> => {
    return fetchApi.get<any>('/admin/roles/summary/')
  },
}
