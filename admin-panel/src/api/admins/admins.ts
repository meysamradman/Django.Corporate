import { api } from '@/core/config/api';
import { adminEndpoints } from '@/core/config/adminEndpoints';
import { convertToLimitOffset, normalizePaginationParams } from '@/core/utils/pagination';
import type { Pagination } from '@/types/api/apiResponse';
import type { 
  AdminWithProfile, 
  AdminCreateRequest, 
  AdminUpdateRequest, 
  UserType,
  AdminListResponse
} from '@/types/auth/admin';
import type { AdminFilter, UserFilter, Filter } from '@/types/auth/adminFilter';

export function createQueryString(params: Record<string, unknown>, additionalParams?: Record<string, unknown>): string {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v.toString()));
      } else {
        queryParams.append(key, value.toString());
      }
    }
  }

  if (additionalParams) {
    for (const [key, value] of Object.entries(additionalParams)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    }
  }
  
  return queryParams.toString();
}

export const SERVER_PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
  VALID_PAGE_SIZES: [10, 20, 30, 50],
  LIMIT_PARAM: 'limit',
  OFFSET_PARAM: 'offset'
};

export const adminApi = {
  getProfile: async (): Promise<AdminWithProfile> => {
    const response = await api.get<AdminWithProfile>(adminEndpoints.profile());
    if (!response.data) {
      throw new Error("API returned success but no admin profile data found.");
    }
    return response.data;
  },

  updateProfile: async (profileData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    province?: number | null;
    city?: number | null;
    bio?: string;
    national_id?: string;
    profile_picture?: number | null;
  }): Promise<AdminWithProfile> => {
    const response = await api.put<AdminWithProfile>(adminEndpoints.profile(), profileData);
    if (!response.data) {
      throw new Error("API returned success but no updated profile data found.");
    }
    return response.data;
  },

  fetchUsersList: async (
    userType: UserType,
    filters?: Filter
  ) => {
    const finalFilters: Record<string, unknown> = filters ? { ...filters } : {};

    const normalizedParams = normalizePaginationParams(
      { page: finalFilters.page as number | undefined, size: finalFilters.size as number | undefined },
      SERVER_PAGINATION_CONFIG.DEFAULT_LIMIT,
      SERVER_PAGINATION_CONFIG.VALID_PAGE_SIZES
    );
    
    const { limit, offset } = convertToLimitOffset(normalizedParams.page, normalizedParams.size);
    
    const apiFilters = { ...finalFilters };
    delete apiFilters.page;
    delete apiFilters.size;
    apiFilters.limit = limit;
    apiFilters.offset = offset;

    const queryString = createQueryString(apiFilters);
    
    const endpointUrl = userType === 'admin'
      ? `${adminEndpoints.management()}?${queryString}`
      : `${adminEndpoints.usersManagement()}?${queryString}`;

    const response = await api.get<AdminListResponse | AdminWithProfile[]>(endpointUrl);

    let data: AdminWithProfile[] = [];
    let pagination: Pagination = { 
      count: 0, 
      next: null, 
      previous: null, 
      page_size: finalFilters.size || SERVER_PAGINATION_CONFIG.DEFAULT_LIMIT, 
      current_page: finalFilters.page || 1, 
      total_pages: 0 
    };

    if (response && typeof response === 'object' && 'metaData' in response && Array.isArray(response.data) && response.pagination) {
      data = response.data;
      pagination = response.pagination;
    } else if (response && typeof response === 'object' && 'metaData' in response && Array.isArray(response.data)) {
      data = response.data;
      pagination = {
        count: data.length,
        next: null,
        previous: null,
        page_size: data.length,
        current_page: 1,
        total_pages: 1
      };
    } else if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null && 'data' in response.data && Array.isArray(response.data.data) && 'pagination' in response.data && response.data.pagination) {
      data = response.data.data;
      pagination = response.data.pagination;
    } else if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null && 'results' in response.data && Array.isArray(response.data.results)) {
      const responseData = response.data as AdminListResponse;
      data = responseData.results || [];
      pagination.count = responseData.count || 0;
      pagination.next = responseData.next ?? null;
      pagination.previous = responseData.previous ?? null;
      pagination.total_pages = Math.ceil((pagination.count || 0) / (pagination.page_size || 10));
    } else {
      data = [];
      pagination = { 
        count: 0, 
        next: null, 
        previous: null, 
        page_size: finalFilters.size || SERVER_PAGINATION_CONFIG.DEFAULT_LIMIT, 
        current_page: 1, 
        total_pages: 0 
      };
    }

    pagination = {
      count: pagination.count || 0,
      next: pagination.next || null,
      previous: pagination.previous || null,
      page_size: pagination.page_size || finalFilters.size || SERVER_PAGINATION_CONFIG.DEFAULT_LIMIT,
      current_page: pagination.current_page || finalFilters.page || 1,
      total_pages: pagination.total_pages || (pagination.count && pagination.page_size ? Math.ceil(pagination.count / pagination.page_size) : 0)
    };

    return {
      metaData: response?.metaData,
      data,
      pagination
    };
  },

  fetchUserById: async (userId: number, userType: UserType = 'admin'): Promise<AdminWithProfile> => {
    const endpointUrl = userType === 'admin' 
      ? adminEndpoints.managementById(userId) 
      : adminEndpoints.usersManagementById(userId);

    const response = await api.get<AdminWithProfile>(endpointUrl);
    return response.data;
  },

  createUserByType: async (flattenedUserData: Record<string, unknown>, userType: UserType): Promise<AdminWithProfile> => {
    const dataToSend: Record<string, unknown> = {
      ...flattenedUserData,
      is_staff: userType === 'admin',
      is_superuser: userType === 'admin' ? (flattenedUserData.is_superuser ?? false) : false
    };

    if (userType === 'user') {
      if (dataToSend.province !== undefined && dataToSend.province_id === undefined) {
        dataToSend.province_id = dataToSend.province;
        delete dataToSend.province;
      }
      if (dataToSend.city !== undefined && dataToSend.city_id === undefined) {
        dataToSend.city_id = dataToSend.city;
        delete dataToSend.city;
      }
    }

    const endpoint = userType === 'admin' 
      ? adminEndpoints.management() 
      : adminEndpoints.usersManagement();
    
    const response = await api.post<AdminWithProfile>(endpoint, dataToSend);
    return response.data;
  },

  updateUserByType: async (userId: number, flattenedUserData: Record<string, unknown>, userType: UserType): Promise<AdminWithProfile> => {
    const { role_id, ...rest } = flattenedUserData;
    const dataToSend: Record<string, unknown> = { ...rest };

    if (userType === 'user') {
      if (dataToSend.province !== undefined && dataToSend.province_id === undefined) {
        dataToSend.province_id = dataToSend.province;
        delete dataToSend.province;
      }
      if (dataToSend.city !== undefined && dataToSend.city_id === undefined) {
        dataToSend.city_id = dataToSend.city;
        delete dataToSend.city;
      }
    }
    
    const endpoint = userType === 'admin' 
      ? adminEndpoints.managementById(userId)
      : adminEndpoints.usersManagementById(userId);
    
    const response = await api.put<AdminWithProfile>(endpoint, dataToSend);
    
    if (role_id !== undefined && userType === 'admin') {
      try {
        if (role_id === 'none' || role_id === '' || role_id === null) {
          const currentRoles = await adminApi.getAdminRoles(userId);
          for (const role of currentRoles) {
            await adminApi.removeRoleFromAdmin(userId, role.role);
          }
        } else {
          await adminApi.assignRoleToAdmin(userId, Number(role_id));
        }
      } catch {
      }
    }
    
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error("Invalid response structure during user update.");
    }
  },

  deleteUserByType: async (userId: number): Promise<void> => {
    let endpoint = adminEndpoints.managementById(userId);
    
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/users')) {
        endpoint = adminEndpoints.usersManagementById(userId);
      }
    }
    
    await api.delete(endpoint);
  },

  updateUserStatusByType: async (userId: number, isActive: boolean, userType: UserType): Promise<AdminWithProfile> => {
    const endpointUrl = userType === 'admin' 
      ? adminEndpoints.managementById(userId) 
      : adminEndpoints.usersManagementById(userId);
    const payload = { is_active: isActive };

    const response = await api.put<AdminWithProfile>(endpointUrl, payload);
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error(`Invalid response structure received when updating status for ${userType} ID ${userId}`);
    }
  },

  bulkDeleteUsersByType: async (userIds: number[]): Promise<void> => {
    let endpoint = adminEndpoints.managementBulkDelete();
    
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/users')) {
        endpoint = adminEndpoints.usersManagementBulkDelete();
      }
    }
    
    await api.post(endpoint, { ids: userIds });
  },

  getAdminRoles: async (adminId: number): Promise<Array<{ role: number; role_name?: string }>> => {
    const timestamp = Date.now();
    const response = await api.get<{roles: Array<{ role: number; role_name?: string }>}>(`${adminEndpoints.rolesUserRoles(adminId)}&_t=${timestamp}`);
    return response.data?.roles || [];
  },

  assignRoleToAdmin: async (adminId: number, roleId: number): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post<{ success: boolean; message?: string }>(adminEndpoints.rolesAssignRole(), {
      user_id: adminId,
      role_ids: [roleId]
    });
    return response.data;
  },

  removeRoleFromAdmin: async (adminId: number, roleId: number): Promise<void> => {
    await api.delete(adminEndpoints.rolesRemoveRole(roleId, adminId));
  },

  getAdminList: async (filters: AdminFilter = {}) => {
    return adminApi.fetchUsersList('admin', filters);
  },

  getAllAdmins: async () => {
    return adminApi.fetchUsersList('admin', { no_pagination: true });
  },

  getAdminById: async (adminId: number): Promise<AdminWithProfile> => {
    return adminApi.fetchUserById(adminId, 'admin');
  },

  getCurrentAdminManagedProfile: async (): Promise<AdminWithProfile> => {
    const response = await api.get<AdminWithProfile>(adminEndpoints.profileMe());
    return response.data;
  },

  createAdmin: async (adminData: AdminCreateRequest): Promise<AdminWithProfile> => {
    return adminApi.createUserByType(adminData as unknown as Record<string, unknown>, 'admin');
  },

  updateAdmin: async (adminId: number, adminData: AdminUpdateRequest): Promise<AdminWithProfile> => {
    return adminApi.updateUserByType(adminId, adminData as unknown as Record<string, unknown>, 'admin');
  },

  deleteAdmin: async (adminId: number): Promise<void> => {
    return adminApi.deleteUserByType(adminId);
  },

  updateAdminStatus: async (adminId: number, isActive: boolean): Promise<AdminWithProfile> => {
    return adminApi.updateUserStatusByType(adminId, isActive, 'admin');
  },

  bulkDeleteAdmins: async (adminIds: number[]): Promise<void> => {
    return adminApi.bulkDeleteUsersByType(adminIds);
  },

  getUserList: async (filters?: UserFilter) => {
    return adminApi.fetchUsersList('user', filters);
  },

  getAllUsers: async () => {
    return adminApi.fetchUsersList('user', { no_pagination: true });
  },

  getUserById: async (userId: number): Promise<AdminWithProfile> => {
    return adminApi.fetchUserById(userId, 'user');
  },

  createUser: async (userData: Record<string, unknown>): Promise<AdminWithProfile> => {
    return adminApi.createUserByType(userData, 'user');
  },

  updateUser: async (userId: number, userData: Record<string, unknown>): Promise<AdminWithProfile> => {
    return adminApi.updateUserByType(userId, userData, 'user');
  },

  deleteUser: async (userId: number): Promise<void> => {
    return adminApi.deleteUserByType(userId);
  },

  updateUserStatus: async (userId: number, isActive: boolean): Promise<AdminWithProfile> => {
    return adminApi.updateUserStatusByType(userId, isActive, 'user');
  },

  bulkDeleteUsers: async (userIds: number[]): Promise<void> => {
    return adminApi.bulkDeleteUsersByType(userIds);
  }
};

