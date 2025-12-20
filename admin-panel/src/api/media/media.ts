import { api } from '@/core/config/api';
import type { Media, MediaFilter, MediaUploadSettings } from '@/types/shared/media';
import type { ApiResponse, Pagination } from '@/types/api/apiResponse';
import type { ApiError } from '@/types/api/apiError';
import { csrfManager } from '@/core/auth/session';
import { env } from '@/core/config/environment';
import { normalizePaginationParams } from '@/core/utils/pagination';

export const VALID_MEDIA_PAGE_SIZES = [12, 24, 36, 48];
export const DEFAULT_MEDIA_PAGE_SIZE = 12;

const BASE_MEDIA_PATH = '/admin/media'; 

export const mediaApi = {
    getMediaList: async (
        filters?: MediaFilter
    ): Promise<ApiResponse<Media[]>> => {
        try {
            const safeFilters: Partial<MediaFilter> = filters ? { ...filters } : {};

            const normalizedParams = normalizePaginationParams(
                { page: safeFilters.page, size: safeFilters.size },
                DEFAULT_MEDIA_PAGE_SIZE,
                VALID_MEDIA_PAGE_SIZES
            );
            
            const queryParams = new URLSearchParams();
            if (safeFilters) {
                Object.entries(safeFilters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        if (key === 'page' || key === 'size') return;
                        if (key === 'file_type' && value === 'all') return;
                        queryParams.append(key, String(value));
                    }
                });
                
                if (safeFilters.size) {
                    queryParams.append('limit', String(safeFilters.size));
                } else {
                    queryParams.append('limit', String(DEFAULT_MEDIA_PAGE_SIZE));
                }
                
                const pageSize = safeFilters.size || DEFAULT_MEDIA_PAGE_SIZE;
                const page = safeFilters.page || 1;
                const offset = (page - 1) * pageSize;
                queryParams.append('offset', String(offset));
            }

            const endpoint = `${BASE_MEDIA_PATH}/?${queryParams.toString()}`;
            const response = await api.get<Media[]>(endpoint);

            if (!response.pagination) {
                const count = response.data?.length || 0;
                response.pagination = {
                    count: count,
                    next: null,
                    previous: null,
                    page_size: normalizedParams.size,
                    current_page: normalizedParams.page,
                    total_pages: Math.ceil(count / normalizedParams.size)
                };
            } else {
                const pageSize = response.pagination.page_size || normalizedParams.size;
                const totalCount = response.pagination.count || 0;
                
                response.pagination.current_page = normalizedParams.page;
                response.pagination.page_size = pageSize;
                response.pagination.total_pages = Math.ceil(totalCount / pageSize);
            }

            return response;
        } catch (error: unknown) {
            let message = "Failed to fetch media list";
            let statusCode = 500;

            if (error instanceof ApiError) {
                message = error.message;
                statusCode = error.response.AppStatusCode;
            } else if (error instanceof Error) {
                message = error.message;
            }
            return {
                 metaData: {
                     status: 'error',
                     message: message,
                     AppStatusCode: statusCode,
                     timestamp: new Date().toISOString()
                 },
                 data: [] as Media[],
                 pagination: {
                     count: 0, next: null, previous: null,
                     page_size: filters?.size || DEFAULT_MEDIA_PAGE_SIZE,
                     current_page: filters?.page || 1,
                     total_pages: 1
                 } as Pagination
            };
        }
    },

    getMediaDetails: async (
        mediaId: number | string
    ): Promise<ApiResponse<Media>> => {
        try {
            const mediaIdNumber = typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId;
            
            if (isNaN(mediaIdNumber)) {
                throw new Error(`Invalid media ID: ${mediaId}`);
            }
            
            const endpoint = `${BASE_MEDIA_PATH}/${mediaIdNumber}`;
            
            try {
                const response = await api.get<Media>(endpoint);
                
                if (response && typeof response === 'object' && !('metaData' in response)) {
                                          return {
                         metaData: { status: 'success', message: 'Details fetched', AppStatusCode: 200, timestamp: new Date().toISOString() },
                         data: response as Media
                     };
                }

                return response;
            } catch (metadataError) {
                const listFilter: MediaFilter = {
                    page: 1,
                    size: 100,
                };
                
                const listResponse = await mediaApi.getMediaList(listFilter);
                
                if (listResponse.metaData.status === 'success' && Array.isArray(listResponse.data)) {
                    const mediaItem = listResponse.data.find((item: Media) => item.id === mediaIdNumber);
                    
                    if (mediaItem) {

                        return {
                            metaData: { 
                                status: 'success', 
                                message: 'Media details fetched from list', 
                                AppStatusCode: 200, 
                                timestamp: new Date().toISOString() 
                            },
                            data: mediaItem
                        };
                    }
                }
                
                throw metadataError;
            }
        } catch (error: unknown) {
            let message = `Failed to fetch details for media ID ${mediaId}`;
            let statusCode = 500;

            if (error instanceof ApiError) {
                message = error.message;
                statusCode = error.response.AppStatusCode;
            } else if (error instanceof Error) {
                message = error.message;
            }

            return {
                metaData: { status: 'error', message: message, AppStatusCode: statusCode, timestamp: new Date().toISOString() },
                data: null as unknown as Media
            };
        }
    },

    uploadMedia: async (
        formData: FormData,
        options?: {
            onProgress?: (progress: number) => void;
            cookieHeader?: string;
            signal?: AbortSignal;
        }
    ): Promise<ApiResponse<Media>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/`;
            const xhr = new XMLHttpRequest();
            
            const uploadPromise = new Promise<ApiResponse<Media>>((resolve, reject) => {
                if (options?.signal) {
                    options.signal.addEventListener('abort', () => {
                        xhr.abort();
                        reject(new Error('Upload cancelled'));
                    });
                }

                xhr.open('POST', `${env.API_URL}${endpoint}`);
                
                if (options?.cookieHeader) {
                    xhr.setRequestHeader('Cookie', options.cookieHeader);
                }
                
                const csrfToken = csrfManager.getToken();
                if (csrfToken) {
                    xhr.setRequestHeader('X-CSRFToken', csrfToken);
                }
                
                xhr.withCredentials = true;
                
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && options?.onProgress) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        options.onProgress(percentComplete);
                    }
                };
                
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const responseData = JSON.parse(xhr.responseText);
                            
                            let formattedResponse: ApiResponse<Media>;
                            
                            if (responseData && responseData.metaData) {
                                formattedResponse = responseData;
                            } else if (responseData && responseData.data) {
                                formattedResponse = {
                                    metaData: {
                                        status: 'success',
                                        message: 'Media uploaded successfully',
                                        AppStatusCode: xhr.status,
                                        timestamp: new Date().toISOString()
                                    },
                                    data: responseData.data
                                };
                            } else {
                                formattedResponse = {
                                    metaData: {
                                        status: 'success',
                                        message: 'Media uploaded successfully',
                                        AppStatusCode: xhr.status,
                                        timestamp: new Date().toISOString()
                                    },
                                    data: responseData
                                };
                            }
                            
                            resolve(formattedResponse);
                        } catch {
                            reject(new Error('Failed to parse server response'));
                        }
                    } else {
                        let errorMessage = 'Upload failed';
                        let errorData = null;
                        
                        try {
                            errorData = JSON.parse(xhr.responseText);
                            if (errorData.metaData && errorData.metaData.message) {
                                errorMessage = errorData.metaData.message;
                            } else if (errorData.detail) {
                                errorMessage = errorData.detail;
                            } else if (errorData.message) {
                                errorMessage = errorData.message;
                            }
                        } catch {
                            errorMessage = xhr.statusText || 'Upload failed';
                        }
                        
                        reject(new Error(errorMessage));
                    }
                };
                
                xhr.onerror = () => {
                    reject(new Error('Network error during upload'));
                };
                
                xhr.ontimeout = () => {
                    reject(new Error('Upload request timed out'));
                };
                
                xhr.send(formData);
            });
            
            return await uploadPromise;
        } catch (error: unknown) {
            let message = "Failed to upload media";
            let statusCode = 500;

            if (error instanceof ApiError) {
                message = error.message;
                statusCode = error.response.AppStatusCode;
            } else if (error instanceof Error) {
                message = error.message;
            }

            return {
                metaData: {
                    status: 'error',
                    message: message,
                    AppStatusCode: statusCode,
                    timestamp: new Date().toISOString()
                },
                data: null as unknown as Media
            };
        }
    },

    deleteMedia: async (
        mediaId: number | string
    ): Promise<ApiResponse<{ deleted: boolean }>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
            return await api.delete<{ deleted: boolean }>(endpoint);
        } catch (error: unknown) {
            showError(error);
            
            let message = "Failed to delete media";
            let statusCode = 500;

            if (error instanceof ApiError) {
                message = error.message;
                statusCode = error.response.AppStatusCode;
            } else if (error instanceof Error) {
                message = error.message;
            }

            return {
                metaData: {
                    status: 'error',
                    message: message,
                    AppStatusCode: statusCode,
                    timestamp: new Date().toISOString()
                },
                data: { deleted: false }
            };
        }
    },

    updateMedia: async (
        mediaId: number | string,
        updateData: Partial<Media>
    ): Promise<ApiResponse<Media>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
            return await api.put<Media>(endpoint, updateData);
        } catch (error: unknown) {
            showError(error);
            
            let message = "Failed to update media";
            let statusCode = 500;

            if (error instanceof ApiError) {
                message = error.message;
                statusCode = error.response.AppStatusCode;
            } else if (error instanceof Error) {
                message = error.message;
            }

            return {
                metaData: {
                    status: 'error',
                    message: message,
                    AppStatusCode: statusCode,
                    timestamp: new Date().toISOString()
                },
                data: null as unknown as Media
            };
        }
    },

    updateCoverImage: async (
        mediaId: number | string,
        coverImageId: number | null
    ): Promise<ApiResponse<Media>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
            const updateData = {
                cover_image: coverImageId
            };
            const response = await api.patch<Media>(endpoint, updateData);
            if (response.metaData.status === 'success' && response.data) {
                if (coverImageId === null) {
                    response.data.cover_image = null;
                    response.data.cover_image_url = undefined;
                }
                            }
            
            return response;
        } catch (error: unknown) {
            showError(error);
            
            let message = "Failed to update cover image";
            let statusCode = 500;

            if (error instanceof ApiError) {
                message = error.message;
                statusCode = error.response.AppStatusCode;
            } else if (error instanceof Error) {
                message = error.message;
            }

            return {
                metaData: {
                    status: 'error',
                    message: message,
                    AppStatusCode: statusCode,
                    timestamp: new Date().toISOString()
                },
                data: null as unknown as Media
            };
        }
    },

    bulkDeleteMedia: async (
        mediaItems: Media[]
    ): Promise<ApiResponse<{ deleted_count: number }>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/bulk-delete`;
            const mediaData = mediaItems.map(item => ({ 
                id: item.id, 
                type: item.media_type || 'image'
            }));
            
            return await api.post<{ deleted_count: number }>(endpoint, { media_data: mediaData });
        } catch (error: unknown) {
            showError(error);
            
            let message = "Failed to delete media items";
            let statusCode = 500;

            if (error instanceof ApiError) {
                message = error.message;
                statusCode = error.response.AppStatusCode;
            } else if (error instanceof Error) {
                message = error.message;
            }

            return {
                metaData: {
                    status: 'error',
                    message: message,
                    AppStatusCode: statusCode,
                    timestamp: new Date().toISOString()
                },
                data: { deleted_count: 0 }
            };
        }
    },

    getUploadSettings: async (clearCache: boolean = false): Promise<MediaUploadSettings> => {
        const url = clearCache 
            ? '/core/upload-settings/?clear_cache=true'
            : '/core/upload-settings/';
        
        const response = await api.get<MediaUploadSettings>(url);
        
        if (!response.data) {
            throw new Error("API returned success but no upload settings data found.");
        }
        
        return response.data;
    },

};
