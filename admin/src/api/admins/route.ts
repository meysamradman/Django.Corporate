import { fetchApi } from '@/core/config/fetch'
import { ApiResponse, Pagination } from '@/types/api/apiResponse'
import { AdminWithProfile } from '@/types/auth/admin';
import { convertToLimitOffset, normalizePaginationParams } from '@/core/utils/pagination';

export type UserStatus = 'active' | 'inactive' | 'all';

export interface Filter {
    [key: string]: string | number | boolean | string[] | undefined;
    search_query?: string;
    page?: number;
    size?: number;
    limit?: number;
    offset?: number;
}

export interface AdminFilter extends Filter {
    is_active?: boolean;
    is_superuser?: boolean;
}

export interface UserFilter extends Filter {
    is_active?: boolean;
}

export const ADMIN_CACHE_TAG = 'admin-list';
export const USER_CACHE_TAG = 'user-list';

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

interface EnhancedFilter extends Filter {
    page?: number;
    size?: number;
    limit?: number;
    offset?: number;
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
        cache?: RequestCache;
        revalidate?: number | false;
        tags?: string[];
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
        province?: number | null; // ID بجای نام
        city?: number | null; // ID بجای نام
        bio?: string;
        national_id?: string;
    }): Promise<AdminWithProfile> => {
        try {
            const response = await fetchApi.put<AdminWithProfile>('/admin/profile/', profileData);
            if (!response.data) {
                throw new Error("API returned success but no updated profile data found.");
            }
            return response.data;
        } catch (error) {
            console.error('Error updating admin profile:', error);
            throw error;
        }
    },

    fetchUsersList: async (
        userType: UserType,
        filters?: Filter,
        options?: {
            cache?: RequestCache;
            revalidate?: number | false;
            tags?: string[];
            cookieHeader?: string;
        }
    ) => {
        try {
            const finalFilters: Record<string, any> = filters ? { ...filters } : {};

            // Normalize pagination parameters
            const normalizedParams = normalizePaginationParams(
                { page: finalFilters.page, size: finalFilters.size },
                SERVER_PAGINATION_CONFIG.DEFAULT_LIMIT,
                SERVER_PAGINATION_CONFIG.VALID_PAGE_SIZES
            );
            
            // Convert page/size to limit/offset for Django API
            const { limit, offset } = convertToLimitOffset(normalizedParams.page, normalizedParams.size);
            
            // Create API filters with limit/offset instead of page/size
            const apiFilters = { ...finalFilters };
            delete apiFilters.page;
            delete apiFilters.size;
            apiFilters.limit = limit;
            apiFilters.offset = offset;

    

            const queryString = createQueryString(apiFilters);
            const cacheTag = userType === 'admin' ? ADMIN_CACHE_TAG : USER_CACHE_TAG;
            
            let endpointUrl = '';
            if (userType === 'admin') {
                endpointUrl = `/admin/management/?${queryString}`;
            } else {
                endpointUrl = `/admin/users-management/?${queryString}`;
            }
            
    

            const fetchOptions = {
                cache: options?.cache,
                revalidate: options?.revalidate,
                tags: [cacheTag],
                cookieHeader: options?.cookieHeader,
            };

            const response = await fetchApi.get<any>(endpointUrl, fetchOptions);
    

            let data: AdminWithProfile[] = [];
            let pagination: Pagination = { count: 0, next: null, previous: null, page_size: finalFilters.size, current_page: finalFilters.page, total_pages: 0 };

            // Check for new API response format with pagination
            if (response && typeof response === 'object' && 'metaData' in response && Array.isArray(response.data) && response.pagination) {
                data = response.data;
                pagination = response.pagination;
            } 
            // Check for new API response format without pagination
            else if (response && typeof response === 'object' && 'metaData' in response && Array.isArray(response.data)) {
                data = response.data;
                console.warn(`fetchUsersList for ${userType}: Response missing pagination info. Assuming single page.`);
                pagination = {
                    count: data.length,
                    next: null,
                    previous: null,
                    page_size: data.length,
                    current_page: 1,
                    total_pages: 1
                };
            }
            // Check for custom paginated response (old format)
            else if (response && typeof response === 'object' && Array.isArray((response as any).data) && (response as any).pagination && typeof (response as any).pagination.count === 'number') {
                data = (response as any).data;
                pagination = (response as any).pagination;
            } 
            // Check for DRF paginated response (old format)
            else if (response && typeof response === 'object' && Array.isArray((response as any).results) && typeof (response as any).count === 'number') {
                 data = (response as any).results;
                 pagination.count = (response as any).count;
                 pagination.next = (response as any).next ?? null;
                 pagination.previous = (response as any).previous ?? null;
                 pagination.total_pages = Math.ceil((response as any).count / (pagination.page_size || 10));
            } 
            // Check for simple data array in metaData (fallback)
            else if (response && typeof response === 'object' && 'metaData' in response && Array.isArray(response.data)) {
                const apiResponse = response as ApiResponse<AdminWithProfile[]>;
                data = apiResponse.data;
                 console.warn(`fetchUsersList for ${userType}: Response missing pagination info. Assuming single page.`);
                 pagination = {
                     count: data.length,
                     next: null,
                     previous: null,
                     page_size: data.length,
                     current_page: 1,
                     total_pages: 1
                 };
            } else {
                 console.warn(`fetchUsersList for ${userType}: Unexpected response structure. Assuming empty list.`);
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
            console.error(`Error in fetchUsersList for ${userType}:`, error);
            throw error;
        }
    },

    fetchAllUsers: async (
        userType: UserType,
        options?: {
            cache?: RequestCache;
            revalidate?: number | false;
            tags?: string[];
            cookieHeader?: string;
        }
    ) => {
        try {
            const cacheTag = userType === 'admin' ? ADMIN_CACHE_TAG : USER_CACHE_TAG;
            
            const endpointUrl = `/admin/management/?no_pagination=true&user_type=${userType}`;

            const fetchOptions = {
                cache: options?.cache || 'force-cache',
                revalidate: options?.revalidate !== undefined ? options.revalidate : 300,
                tags: [cacheTag],
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
        options?: {
            cookieHeader?: string;
        }
    ): Promise<AdminWithProfile> => {
        try {
            const fetchOptions = {
                cache: 'no-store' as RequestCache,
                cookieHeader: options?.cookieHeader,
            };
            const endpointUrl = `/admin/management/${userId}/`;
    
            const response = await fetchApi.get<AdminWithProfile>(endpointUrl, fetchOptions);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createUserByType: async (flattenedUserData: Record<string, any>, userType: UserType): Promise<AdminWithProfile> => {
        try {
            const dataToSend = {
                ...flattenedUserData,
                is_staff: userType === 'admin',
                is_superuser: userType === 'admin' ? (flattenedUserData.is_superuser ?? false) : false
            };

            // Directly send JSON data, assume profile_picture_id is already part of flattenedUserData
            const response = await fetchApi.post<AdminWithProfile>('/admin/management/', dataToSend);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateUserByType: async (userId: number, flattenedUserData: Record<string, any>, userType: UserType): Promise<AdminWithProfile> => {
        try {
            // Directly send JSON data, assume profile_picture_id is already part of flattenedUserData
            const response = await fetchApi.put<AdminWithProfile>(`/admin/management/${userId}/`, flattenedUserData);
            
            if (flattenedUserData.role_id !== undefined && userType === 'admin') {
         
            }
            
            if (response && response.data) {
                 return response.data;
            } else {
                 console.error(`updateUserByType received unexpected response for ID ${userId}:`, response);
                 throw new Error("Invalid response structure during user update.");
            }
        } catch (error) {
            throw error;
        }
    },

    deleteUserByType: async (userId: number): Promise<void> => {
        try {
            // Determine endpoint based on context
            let endpoint = `/admin/management/${userId}/`;
            
            // Check if we're in users page context
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
            const endpointUrl = `/admin/management/${userId}/`;
            const payload = { is_active: isActive };
    
            const response = await fetchApi.put<AdminWithProfile>(endpointUrl, payload);
            if (response && response.data) {
                return response.data;
            } else {
                console.error('updateUserStatusByType received unexpected response structure:', response);
                 throw new Error(`Invalid response structure received when updating status for ${userType} ID ${userId}`);
            }
        } catch (error) {
            console.error(`Error updating ${userType} status for ID ${userId}:`, error);
            throw error;
        }
    },

    bulkDeleteUsersByType: async (userIds: number[], userType?: 'admin' | 'user'): Promise<void> => {
        try {
            // Determine endpoint based on context
            let endpoint = '/admin/management/bulk-delete/';
            
            // Check if we're in users page context
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
            console.error(`Error in bulkDeleteUsersByType:`, error);
            throw error;
        }
    },

    getAdminRoles: async (adminId: number): Promise<any[]> => {
        try {
            const response = await fetchApi.get<{roles: any[]}>(`/admin/roles/user_roles/?user_id=${adminId}`);
            return response.data?.roles || [];
        } catch (error) {
            console.error("Error fetching admin roles:", error);
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
            cache?: RequestCache;
            revalidate?: number | false;
            tags?: string[];
            cookieHeader?: string;
        }
    ) => {
        try {
            return await adminApi.fetchUsersList('admin', filters, options);
        } catch (error) {
            console.error('Error in getAdminList:', error);
            throw error; 
        }
    },

    getAllAdmins: async (options?: {
        cache?: RequestCache;
        revalidate?: number | false;
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
        return adminApi.fetchUserById(adminId, options);
    },

    createAdmin: async (adminData: Partial<AdminWithProfile>, profilePicture?: File): Promise<AdminWithProfile> => {
        return adminApi.createUserByType(adminData, 'admin');
    },

    updateAdmin: async (adminId: number, adminData: Record<string, any>, profilePicture?: File, shouldRemoveImage?: boolean): Promise<AdminWithProfile> => {

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

    getUserList: async (filters?: UserFilter, options?: { cache?: RequestCache, revalidate?: number | false }) => {
        return adminApi.fetchUsersList('user', filters, options);
    },

    getAllUsers: async (options?: { cache?: RequestCache, revalidate?: number | false }) => {
        return adminApi.fetchAllUsers('user', options);
    },

    getUserById: async (userId: number, options?: { cookieHeader?: string }): Promise<AdminWithProfile> => {
        return adminApi.fetchUserById(userId, options);
    },

    createUser: async (userData: Partial<AdminWithProfile>, profilePicture?: File): Promise<AdminWithProfile> => {
        return adminApi.createUserByType(userData, 'user');
    },

    updateUser: async (userId: number, userData: Partial<AdminWithProfile>, profilePicture?: File, shouldRemoveImage?: boolean): Promise<AdminWithProfile> => {
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
