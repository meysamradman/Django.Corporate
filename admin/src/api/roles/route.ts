'use client'

import { fetchApi } from '@/core/config/fetch'
import { ApiResponse } from '@/types/api/apiResponse'
import { Role, PermissionGroup, RoleListParams } from '@/types/auth/permission'
import { convertToLimitOffset } from '@/core/utils/pagination';
import { ApiPagination } from '@/types/shared/pagination';

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
    
    const response = await fetchApi.get<Role[]>(url)
    
    const responseData = Array.isArray(response.data) ? response.data : [];
    const responsePagination = response.pagination;
    
    const count = responsePagination?.count || responseData.length;
    const pageSize = responsePagination?.page_size || (params?.size || 10);
    const totalPages = responsePagination?.total_pages || Math.ceil(count / pageSize);
    
    return {
      metaData: response.metaData,
      data: responseData,
      pagination: {
        count: count,
        next: responsePagination?.next || null,
        previous: responsePagination?.previous || null,
        page_size: pageSize,
        current_page: responsePagination?.current_page || (params?.page || 1),
        total_pages: totalPages
      }
    } as ApiResponse<Role[]>
  },

  // Get all roles by fetching all pages
  // Optimized: If total_pages is 1, only one request is made. Otherwise, loops through all pages.
  getAllRoles: async (params: Omit<RoleListParams, 'page' | 'size'> = {}): Promise<Role[]> => {
    const allRoles: Role[] = [];
    const pageSize = 100; // Fetch 100 at a time
    let currentPage = 1;
    let totalPages = 1;

    // Fetch first page
    const firstResponse = await roleApi.getRoleList({
      ...params,
      page: currentPage,
      size: pageSize,
    });

    if (firstResponse.data && Array.isArray(firstResponse.data)) {
      allRoles.push(...firstResponse.data);
    }

    totalPages = firstResponse.pagination?.total_pages || 1;

    // Only loop if there are more pages
    while (currentPage < totalPages) {
      currentPage++;
      const response = await roleApi.getRoleList({
        ...params,
        page: currentPage,
        size: pageSize,
      });

      if (response.data && Array.isArray(response.data)) {
        allRoles.push(...response.data);
      }
    }

    return allRoles;
  },

  getRoleById: async (id: number): Promise<ApiResponse<Role>> => {
    return fetchApi.get<Role>(`/admin/roles/${id}/`)
  },

  createRole: async (data: { name: string; description?: string; permissions?: any }): Promise<ApiResponse<Role>> => {
    // ✅ FIX: Accept permissions directly from frontend
    const requestData = {
      name: data.name,
      display_name: data.name,
      description: data.description || '',
      permissions: data.permissions || { specific_permissions: [] }
    };
    
    return fetchApi.post<Role>('/admin/roles/', requestData)
  },

  updateRole: async (id: number, data: { name?: string; description?: string; permissions?: any }): Promise<ApiResponse<Role>> => {
    // ✅ FIX: Accept permissions directly from frontend
    const updateData: any = {
      name: data.name,
      description: data.description,
      permissions: data.permissions || { specific_permissions: [] }
    };
    
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
