import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse'
import type { Role, PermissionGroup, RoleListParams } from '@/types/auth/permission'
import { convertToLimitOffset } from '@/core/utils/pagination';
import type { ApiPagination } from '@/types/shared/pagination';
import { adminEndpoints } from '@/core/config/adminEndpoints';

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
    const baseUrl = adminEndpoints.roles()
    const url = `${baseUrl}${queryString ? `?${queryString}` : ''}`
    
    const response = await api.get<Role[]>(url)
    
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

  getAllRoles: async (params: Omit<RoleListParams, 'page' | 'size'> = {}): Promise<Role[]> => {
    const allRoles: Role[] = [];
    const pageSize = 100;
    let currentPage = 1;
    let totalPages = 1;

    const firstResponse = await roleApi.getRoleList({
      ...params,
      page: currentPage,
      size: pageSize,
    });

    if (firstResponse.data && Array.isArray(firstResponse.data)) {
      allRoles.push(...firstResponse.data);
    }

    totalPages = firstResponse.pagination?.total_pages || 1;

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
    return api.get<Role>(`${adminEndpoints.roles()}${id}/`)
  },

  createRole: async (data: { name: string; description?: string; permissions?: any }): Promise<ApiResponse<Role>> => {
    const requestData = {
      name: data.name,
      display_name: data.name,
      description: data.description || '',
      permissions: data.permissions || { specific_permissions: [] }
    };
    
    return api.post<Role>(adminEndpoints.roles(), requestData)
  },

  updateRole: async (id: number, data: { name?: string; description?: string; permissions?: any }): Promise<ApiResponse<Role>> => {
    const updateData: any = {
      name: data.name,
      description: data.description,
      permissions: data.permissions || { specific_permissions: [] }
    };
    
    return api.put<Role>(`${adminEndpoints.roles()}${id}/`, updateData)
  },

  deleteRole: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete<null>(`${adminEndpoints.roles()}${id}/`)
  },

  bulkDeleteRoles: async (ids: number[]): Promise<ApiResponse<{ deleted_count: number }>> => {
    return api.post<{ deleted_count: number }>(adminEndpoints.rolesBulkDelete(), { ids })
  },

  updateRoleStatus: async (id: number, is_active: boolean): Promise<ApiResponse<Role>> => {
    return api.patch<Role>(`${adminEndpoints.roles()}${id}/status/`, { is_active })
  },

  getPermissions: async (): Promise<ApiResponse<PermissionGroup[]>> => {
    return api.get<PermissionGroup[]>(`${adminEndpoints.roles()}permissions/`)
  },

  getBasePermissions: async (): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>(`${adminEndpoints.roles()}base_permissions/`)
  },

  getRolePermissions: async (roleId: number): Promise<ApiResponse<{role_id: number; role_name: string; permissions: Record<string, any>}>> => {
    return api.get<{role_id: number; role_name: string; permissions: Record<string, any>}>(`${adminEndpoints.roles()}${roleId}/role_permissions/`)
  },

  setupDefaultRoles: async (forceUpdate: boolean = false): Promise<ApiResponse<any>> => {
    return api.post<any>(`${adminEndpoints.roles()}setup_default_roles/`, { force_update: forceUpdate })
  },

  getRolesSummary: async (): Promise<ApiResponse<any>> => {
    return api.get<any>(`${adminEndpoints.roles()}summary/`)
  },
}
