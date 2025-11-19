import { fetchApi } from '@/core/config/fetch';
import { Media, MediaFilter } from '@/types/shared/media';
import { ApiResponse, Pagination } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { showErrorToast } from '@/core/config/errorHandler';
import { csrfTokenStore } from '@/core/auth/csrfToken';
import { env } from '@/core/config/environment';
import { convertToLimitOffset, normalizePaginationParams } from '@/core/utils/pagination';

export const MEDIA_CACHE_TAG = 'media';

// Define valid page sizes for the media grid
export const VALID_MEDIA_PAGE_SIZES = [12, 24, 36, 48];
export const DEFAULT_MEDIA_PAGE_SIZE = 12;

// Admin media path - must use admin router
const BASE_MEDIA_PATH = '/admin/media'; 

export const mediaApi = {
    /**
     * Fetches a list of media items.
     * @param filters Optional filters for the media list.
     * @param options Optional fetch options (cache, revalidate, cookieHeader).
     */
    getMediaList: async (
        filters?: MediaFilter,
        options?: {
            cache?: RequestCache;
            revalidate?: number | false;
            cookieHeader?: string;
            forceRefresh?: boolean;
        }
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

            let cacheStrategy: RequestCache = 'no-store';
            let revalidate: number | false = false;

            if (!options?.forceRefresh) {
                if (!safeFilters?.search && !safeFilters?.date_from && !safeFilters?.date_to) {
                    cacheStrategy = 'force-cache';
                    revalidate = 60;
                } else if (safeFilters?.search) {
                    cacheStrategy = 'default';
                    revalidate = 30;
                }
            }

            const fetchOptions = {
                cache: options?.cache ?? cacheStrategy,
                revalidate: options?.revalidate ?? revalidate,
                tags: [MEDIA_CACHE_TAG],
                cookieHeader: options?.cookieHeader,
            };

            // Use the correct endpoint for listing media
            const endpoint = `${BASE_MEDIA_PATH}/?${queryParams.toString()}`;
            const response = await fetchApi.get<Media[]>(endpoint, fetchOptions);

            // Ensure pagination info is properly structured
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
                // Fix pagination data to match frontend expectations
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

            // Check if it's a FetchError instance
            if (error instanceof ApiError) {
                message = error.message; // Use the message from FetchError
                statusCode = error.response.AppStatusCode;
            } else if (error instanceof Error) {
                // Handle generic Error instances
                message = error.message;
            }

            // Return a structured error response
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
                     page_size: filters?.size || DEFAULT_MEDIA_PAGE_SIZE, // Use default
                     current_page: filters?.page || 1,
                     total_pages: 1
                 } as Pagination
            };
        }
    },

    /**
     * Fetches details for a single media item by its ID.
     * @param mediaId The ID of the media item.
     * @param options Optional fetch options.
     */
    getMediaDetails: async (
        mediaId: number | string,
        options?: {
            cache?: RequestCache;
            revalidate?: number | false;
            cookieHeader?: string;
        }
    ): Promise<ApiResponse<Media>> => { // Return a single Media object
        try {
            // Ensure mediaId is a number
            const mediaIdNumber = typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId;
            
            if (isNaN(mediaIdNumber)) {
                throw new Error(`Invalid media ID: ${mediaId}`);
            }
            
            const fetchOptions = {
                cache: options?.cache ?? 'no-store',
                revalidate: options?.revalidate,
                tags: [`${MEDIA_CACHE_TAG}-${mediaIdNumber}`], // Tag for specific item
                cookieHeader: options?.cookieHeader,
            };

            // First try using the detail endpoint
            const endpoint = `${BASE_MEDIA_PATH}/${mediaIdNumber}`;
            
            try {
                const response = await fetchApi.get<Media>(endpoint, fetchOptions);
                
                // Note: Assuming the backend returns ApiResponse<Media>
                // If it just returns Media, we need to wrap it
                if (response && typeof response === 'object' && !('metaData' in response)) {
                                          return {
                         metaData: { status: 'success', message: 'Details fetched', AppStatusCode: 200, timestamp: new Date().toISOString() },
                         data: response as Media
                     };
                }

                return response;
            } catch (metadataError) {
                // If metadata endpoint fails with 404, try fetching from list endpoint
                                // Create a filter to get just this media item
                const listFilter: MediaFilter = {
                    page: 1,
                    size: 100, // Fetch enough to find the item
                };
                
                const listResponse = await mediaApi.getMediaList(listFilter, fetchOptions);
                
                if (listResponse.metaData.status === 'success' && Array.isArray(listResponse.data)) {
                    // Find the media item with matching ID
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
                
                // If we couldn't find the item in the list either, re-throw the original error
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
                data: null as unknown as Media // Return null data on error
            };
        }
    },

    /**
     * Uploads a new media file with progress tracking
     * @param formData FormData containing the file and metadata
     * @param options Optional options including progress callback
     */
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

                xhr.open('POST', `${env.API_BASE_URL}${endpoint}`);
                
                if (options?.cookieHeader) {
                    xhr.setRequestHeader('Cookie', options.cookieHeader);
                }
                
                const csrfToken = csrfTokenStore.getToken();
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
                        } catch (error) {
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

            // Return a structured error response
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

    /**
     * Deletes a media item by ID
     * @param mediaId The ID of the media to delete
     */
    deleteMedia: async (
        mediaId: number | string
    ): Promise<ApiResponse<{ deleted: boolean }>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
            return await fetchApi.delete<{ deleted: boolean }>(endpoint);
        } catch (error: unknown) {
            showErrorToast(error, `Failed to delete media item`);
            
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

    /**
     * Updates a media item
     * @param mediaId The ID of the media to update
     * @param updateData The data to update
     */
    updateMedia: async (
        mediaId: number | string,
        updateData: Partial<Media>
    ): Promise<ApiResponse<Media>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
            // Use PUT for full updates
            return await fetchApi.put<Media>(endpoint, updateData);
        } catch (error: unknown) {
            showErrorToast(error, `Failed to update media item`);
            
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

    /**
     * Updates the cover image for a media item
     * @param mediaId The ID of the media to update
     * @param coverImageId The ID of the cover image media, or null to remove
     */
    updateCoverImage: async (
        mediaId: number | string,
        coverImageId: number | null
    ): Promise<ApiResponse<Media>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
            const updateData = {
                cover_image: coverImageId
            };
            // Use PATCH for partial updates
            const response = await fetchApi.patch<Media>(endpoint, updateData);
                        // Ensure the response contains all necessary data
            if (response.metaData.status === 'success' && response.data) {
                // Make sure cover_image and cover_image_url are properly set
                if (coverImageId === null) {
                    response.data.cover_image = null;
                    response.data.cover_image_url = undefined;
                }
                            }
            
            return response;
        } catch (error: unknown) {
            showErrorToast(error, `Failed to update cover image`);
            
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

    /**
     * Bulk delete multiple media items
     * @param mediaItems Array of media items to delete
     */
    bulkDeleteMedia: async (
        mediaItems: Media[]
    ): Promise<ApiResponse<{ deleted_count: number }>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/bulk-delete`;
            // Fix: Send the correct data structure expected by the backend
            // Backend expects media_data as array of {id, type} objects
            const mediaData = mediaItems.map(item => ({ 
                id: item.id, 
                type: item.media_type || 'image' // Use media_type from the item or default to image
            }));
            
            return await fetchApi.post<{ deleted_count: number }>(endpoint, { media_data: mediaData });
        } catch (error: unknown) {
            showErrorToast(error, `Failed to delete media items`);
            
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

};
