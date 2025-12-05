import { fetchApi } from '@/core/config/fetch'
import { ApiResponse, Pagination } from '@/types/api/apiResponse'
import { AdminWithProfile, AdminCreateRequest, AdminUpdateRequest } from '@/types/auth/admin';
import { Filter, AdminFilter, UserFilter } from '@/types/auth/adminFilter';
import { convertToLimitOffset, normalizePaginationParams } from '@/core/utils/pagination';

export type UserStatus = 'active' | 'inactive' | 'all';

export function createQueryString(params: Record<string, any>, additionalParams?: Record<string, any>): string {
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


export type UserType = 'admin' | 'user';

export const SERVER_PAGINATION_CONFIG = {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
    VALID_PAGE_SIZES: [10, 20, 30, 50],
    LIMIT_PARAM: 'limit',
    OFFSET_PARAM: 'offset'
};

export const adminApi = {

    getProfile: async (options?: {
        cookieHeader?: string;
    }): Promise<AdminWithProfile> => {
        const response = await fetchApi.get<AdminWithProfile>('/admin/profile/', {
            ...options,
        });
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
        try {
            const response = await fetchApi.put<AdminWithProfile>('/admin/profile/', profileData);
            if (!response.data) {
                throw new Error("API returned success but no updated profile data found.");
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    fetchUsersList: async (
        userType: UserType,
        filters?: Filter,
        options?: {
            cookieHeader?: string;
        }
    ) => {
        try {
            const finalFilters: Record<string, any> = filters ? { ...filters } : {};

            const normalizedParams = normalizePaginationParams(
                { page: finalFilters.page, size: finalFilters.size },
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
            
            let endpointUrl = '';
            if (userType === 'admin') {
                endpointUrl = `/admin/management/?${queryString}`;
            } else {
                endpointUrl = `/admin/users-management/?${queryString}`;
            }
            
            const fetchOptions = {
                cookieHeader: options?.cookieHeader,
            };

            const response = await fetchApi.get<any>(endpointUrl, fetchOptions);
    

            let data: AdminWithProfile[] = [];
            let pagination: Pagination = { count: 0, next: null, previous: null, page_size: finalFilters.size, current_page: finalFilters.page, total_pages: 0 };

            if (response && typeof response === 'object' && 'metaData' in response && Array.isArray(response.data) && response.pagination) {
                data = response.data;
                pagination = response.pagination;
            } 
            else if (response && typeof response === 'object' && 'metaData' in response && Array.isArray(response.data)) {
                data = response.data;
                                pagination = {
                    count: data.length,
                    next: null,
                    previous: null,
                    page_size: data.length,
                    current_page: 1,
                    total_pages: 1
                };
            }
            else if (response && typeof response === 'object' && Array.isArray((response as any).data) && (response as any).pagination && typeof (response as any).pagination.count === 'number') {
                data = (response as any).data;
                pagination = (response as any).pagination;
            } 
            else if (response && typeof response === 'object' && Array.isArray((response as any).results) && typeof (response as any).count === 'number') {
                 data = (response as any).results;
                 pagination.count = (response as any).count;
                 pagination.next = (response as any).next ?? null;
                 pagination.previous = (response as any).previous ?? null;
                 pagination.total_pages = Math.ceil((response as any).count / (pagination.page_size || 10));
            } 
            else if (response && typeof response === 'object' && 'metaData' in response && Array.isArray(response.data)) {
                const apiResponse = response as ApiResponse<AdminWithProfile[]>;
                data = apiResponse.data;
                                  pagination = {
                     count: data.length,
                     next: null,
                     previous: null,
                     page_size: data.length,
                     current_page: 1,
                     total_pages: 1
                 };
            } else {
                                  data = [];
                 pagination = { count: 0, next: null, previous: null, page_size: finalFilters.size, current_page: 1, total_pages: 0 };
            }

            pagination = {
                count: pagination.count || 0,
                next: pagination.next || null,
                previous: pagination.previous || null,
                page_size: pagination.page_size || finalFilters.size,
                current_page: pagination.current_page || finalFilters.page,
                total_pages: pagination.total_pages || (pagination.count && pagination.page_size ? Math.ceil(pagination.count / pagination.page_size) : 0)
            };

            return {
                metaData: response?.metaData,
                data,
                pagination
            };
        } catch (error) {
            throw error;
        }
    },

    fetchAllUsers: async (
        userType: UserType,
        options?: {
            cookieHeader?: string;
        }
    ) => {
        try {
            const endpointUrl = `/admin/management/?no_pagination=true&user_type=${userType}`;

            const fetchOptions = {
                cookieHeader: options?.cookieHeader,
            };

            const response = await fetchApi.get<AdminWithProfile[]>(endpointUrl, fetchOptions);

            return response;
        } catch (error) {
            throw error;
        }
    },

    fetchUserById: async (
        userId: number,
        userType: UserType = 'admin',
        options?: {
            cookieHeader?: string;
        }
    ): Promise<AdminWithProfile> => {
        try {
            const fetchOptions = {
                cookieHeader: options?.cookieHeader,
            };
            
            const endpointUrl = userType === 'admin' ? `/admin/management/${userId}/` : `/admin/users-management/${userId}/`;
    
            const response = await fetchApi.get<AdminWithProfile>(endpointUrl, fetchOptions);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createUserByType: async (flattenedUserData: Record<string, any>, userType: UserType): Promise<AdminWithProfile> => {
        try {
            const dataToSend: Record<string, any> = {
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

            const endpoint = userType === 'admin' ? '/admin/management/' : '/admin/users-management/';
            
            const response = await fetchApi.post<AdminWithProfile>(endpoint, dataToSend);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateUserByType: async (userId: number, flattenedUserData: Record<string, any>, userType: UserType): Promise<AdminWithProfile> => {
        try {
            const { role_id, ...rest } = flattenedUserData;
            const dataToSend: Record<string, any> = { ...rest };

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
            
            const endpoint = userType === 'admin' ? `/admin/management/${userId}/` : `/admin/users-management/${userId}/`;
            
            const response = await fetchApi.put<AdminWithProfile>(endpoint, dataToSend);
            
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
                } catch (roleError) {
                }
            }
            
            if (response && response.data) {
                 return response.data;
            } else {
                 throw new Error("Invalid response structure during user update.");
            }
        } catch (error) {
            throw error;
        }
    },

    deleteUserByType: async (userId: number): Promise<void> => {
        try {
            let endpoint = `/admin/management/${userId}/`;
            
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (currentPath.includes('/users')) {
                    endpoint = `/admin/users-management/${userId}/`;
                }
            }
            
            await fetchApi.delete(endpoint);
        } catch (error) {
            throw error;
        }
    },

    updateUserStatusByType: async (userId: number, isActive: boolean, userType: UserType): Promise<AdminWithProfile> => {
        try {
            const endpointUrl = userType === 'admin' ? `/admin/management/${userId}/` : `/admin/users-management/${userId}/`;
            const payload = { is_active: isActive };
    
            const response = await fetchApi.put<AdminWithProfile>(endpointUrl, payload);
            if (response && response.data) {
                return response.data;
            } else {
                 throw new Error(`Invalid response structure received when updating status for ${userType} ID ${userId}`);
            }
        } catch (error) {
            throw error;
        }
    },

    bulkDeleteUsersByType: async (userIds: number[], userType?: 'admin' | 'user'): Promise<void> => {
        try {
            let endpoint = '/admin/management/bulk-delete/';
            
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (currentPath.includes('/users')) {
                    endpoint = '/admin/users-management/bulk-delete/';
                }
            }
            
            await fetchApi.post(endpoint, {
                ids: userIds,
            });
            
    
        } catch (error) {
            throw error;
        }
    },

    getAdminRoles: async (adminId: number): Promise<any[]> => {
        try {
            const timestamp = Date.now();
            const response = await fetchApi.get<{roles: any[]}>(`/admin/roles/user_roles/?user_id=${adminId}&_t=${timestamp}`);
            return response.data?.roles || [];
        } catch (error) {
            throw error;
        }
    },

    assignRoleToAdmin: async (adminId: number, roleId: number): Promise<any> => {
        try {
            const response = await fetchApi.post<any>(`/admin/roles/assign_role/`, {
                user_id: adminId,
                role_ids: [roleId]
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    removeRoleFromAdmin: async (adminId: number, roleId: number): Promise<void> => {
        try {
            await fetchApi.delete(`/admin/roles/${roleId}/remove_role/?user_id=${adminId}`);
        } catch (error) {
            throw error;
        }
    },

    getAdminList: async (
        filters: AdminFilter = {},
        options?: {
            cookieHeader?: string;
        }
    ) => {
        try {
            return await adminApi.fetchUsersList('admin', filters, options);
        } catch (error) {
            throw error; 
        }
    },

    getAllAdmins: async (options?: {
        cookieHeader?: string;
    }) => {
        return adminApi.fetchAllUsers('admin', options);
    },

    getAdminById: async (
        adminId: number,
        options?: {
            cookieHeader?: string;
        }
    ): Promise<AdminWithProfile> => {
        return adminApi.fetchUserById(adminId, 'admin', options);
    },

    getCurrentAdminManagedProfile: async (): Promise<AdminWithProfile> => {
        const response = await fetchApi.get<AdminWithProfile>('/admin/management/me/');
        return response.data;
    },

    createAdmin: async (adminData: AdminCreateRequest, profilePicture?: File): Promise<AdminWithProfile> => {
        return adminApi.createUserByType(adminData, 'admin');
    },

    updateAdmin: async (adminId: number, adminData: AdminUpdateRequest, profilePicture?: File, shouldRemoveImage?: boolean): Promise<AdminWithProfile> => {

        return adminApi.updateUserByType(adminId, adminData, 'admin');
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

    getUserList: async (filters?: UserFilter, options?: {}) => {
        return adminApi.fetchUsersList('user', filters, options);
    },

    getAllUsers: async (options?: {}) => {
        return adminApi.fetchAllUsers('user', options);
    },

    getUserById: async (userId: number, options?: { cookieHeader?: string }): Promise<AdminWithProfile> => {
        return adminApi.fetchUserById(userId, 'user', options);
    },

    createUser: async (userData: any, profilePicture?: File): Promise<AdminWithProfile> => {
        return adminApi.createUserByType(userData, 'user');
    },

    updateUser: async (userId: number, userData: any, profilePicture?: File, shouldRemoveImage?: boolean): Promise<AdminWithProfile> => {
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