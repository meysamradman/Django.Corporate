import { fetchApi } from '@/core/config/fetch';
import { Media, MediaFilter } from '@/types/shared/media';
import { ApiResponse, Pagination } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { showErrorToast } from '@/core/config/errorHandler';
import { csrfTokenStore } from '@/core/auth/sessionToken';
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
        }
    ): Promise<ApiResponse<Media[]>> => {
        try {
            const safeFilters: Partial<MediaFilter> = filters ? { ...filters } : {};

            // Normalize pagination parameters
            const normalizedParams = normalizePaginationParams(
                { page: safeFilters.page, size: safeFilters.size },
                DEFAULT_MEDIA_PAGE_SIZE,
                VALID_MEDIA_PAGE_SIZES
            );
            
            // Build query parameters
            const queryParams = new URLSearchParams();
            if (safeFilters) {
                Object.entries(safeFilters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        // Skip page/size and use limit/offset instead
                        if (key === 'page' || key === 'size') return;
                        // For file_type, we need to handle 'all' case
                        if (key === 'file_type' && value === 'all') return;
                        queryParams.append(key, String(value));
                    }
                });
                
                // Add limit and offset for Django REST Framework pagination
                // Django REST Framework uses limit/offset pagination by default
                if (safeFilters.size) {
                    queryParams.append('limit', String(safeFilters.size));
                } else {
                    queryParams.append('limit', String(DEFAULT_MEDIA_PAGE_SIZE));
                }
                
                // Calculate offset based on page and size
                const pageSize = safeFilters.size || DEFAULT_MEDIA_PAGE_SIZE;
                const page = safeFilters.page || 1;
                const offset = (page - 1) * pageSize;
                queryParams.append('offset', String(offset));
            }

            const fetchOptions = {
                cache: options?.cache ?? 'no-store',
                revalidate: options?.revalidate,
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
            console.error("API Error in getMediaList:", error);

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
                     console.warn("getMediaDetails received raw data, wrapping in ApiResponse");
                     return {
                         metaData: { status: 'success', message: 'Details fetched', AppStatusCode: 200, timestamp: new Date().toISOString() },
                         data: response as Media
                     };
                }

                return response;
            } catch (metadataError) {
                // If metadata endpoint fails with 404, try fetching from list endpoint
                console.warn(`Metadata endpoint failed, trying to fetch media ID ${mediaIdNumber} from list endpoint`);
                
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
            console.error(`API Error in getMediaDetails for ID ${mediaId}:`, error);
            let message = `Failed to fetch details for media ID ${mediaId}`;
            let statusCode = 500;

            if (error instanceof ApiError) {
                message = error.message;
                statusCode = error.response.AppStatusCode;
                console.error(`FetchError details: Status ${statusCode}, Message: ${message}`);
            } else if (error instanceof Error) {
                message = error.message;
                console.error(`Generic Error: ${message}`);
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
        }
    ): Promise<ApiResponse<Media>> => {
        try {
            // Use the correct endpoint for media upload
            const endpoint = `${BASE_MEDIA_PATH}/upload/`;
            
            // Create a custom fetch with progress tracking
            const xhr = new XMLHttpRequest();
            
            // Create a promise to wrap the XHR request
            const uploadPromise = new Promise<ApiResponse<Media>>((resolve, reject) => {
                xhr.open('POST', `${env.API_BASE_URL}${endpoint}`);
                
                // Add authorization header if provided
                if (options?.cookieHeader) {
                    xhr.setRequestHeader('Cookie', options.cookieHeader);
                }
                
                // Add CSRF token header for authenticated requests
                const csrfToken = csrfTokenStore.getToken();
                if (csrfToken) {
                    xhr.setRequestHeader('X-CSRFToken', csrfToken);
                }
                
                // Set credentials to include cookies
                xhr.withCredentials = true;
                
                // Debug: Log cookies being sent (development only)
                if (process.env.NODE_ENV === 'development') {
                    
                }
                
                // Set up progress tracking
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && options?.onProgress) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        options.onProgress(percentComplete);
                    }
                };
                
                // Handle response
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const responseData = JSON.parse(xhr.responseText);
                            
                            // Handle different response formats
                            let formattedResponse: ApiResponse<Media>;
                            
                            // Check if the response has the ApiResponse structure
                            if (responseData && responseData.metaData) {
                                formattedResponse = responseData;
                            } 
                            // Check if response is a plain success object with data
                            else if (responseData && responseData.data) {
                                formattedResponse = {
                                    metaData: {
                                        status: 'success',
                                        message: 'Media uploaded successfully',
                                        AppStatusCode: xhr.status,
                                        timestamp: new Date().toISOString()
                                    },
                                    data: responseData.data
                                };
                            }
                            // Otherwise assume the whole response is the data
                            else {
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
                            console.error("Upload response parse error:", error, "Response:", xhr.responseText);
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
                            
                            console.error("Upload error response:", errorData);
                        } catch {
                            // If response can't be parsed, use status text
                            errorMessage = xhr.statusText || 'Upload failed';
                            console.error("Upload error (unparseable response):", xhr.status, xhr.statusText, xhr.responseText);
                        }
                        
                        reject(new Error(errorMessage));
                    }
                };
                
                // Handle network errors
                xhr.onerror = () => {
                    console.error("Network error during upload");
                    reject(new Error('Network error during upload'));
                };
                
                // Handle timeouts
                xhr.ontimeout = () => {
                    console.error("Upload request timed out");
                    reject(new Error('Upload request timed out'));
                };
                
                // Send the request
                xhr.send(formData);
            });
            
            return await uploadPromise;
        } catch (error: unknown) {
            console.error("API Error in uploadMedia:", error);

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
            console.error(`API Error in deleteMedia for ID ${mediaId}:`, error);
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
            console.error(`API Error in updateMedia for ID ${mediaId}:`, error);
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
            console.log('Update cover image response:', response);
            
            // Ensure the response contains all necessary data
            if (response.metaData.status === 'success' && response.data) {
                // Make sure cover_image and cover_image_url are properly set
                if (coverImageId === null) {
                    response.data.cover_image = null;
                    response.data.cover_image_url = undefined;
                }
                console.log('Final cover image response:', response);
            }
            
            return response;
        } catch (error: unknown) {
            console.error(`API Error in updateCoverImage for ID ${mediaId}:`, error);
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
     * @param mediaIds Array of media IDs to delete
     */
    bulkDeleteMedia: async (
        mediaIds: (number | string)[]
    ): Promise<ApiResponse<{ deleted_count: number }>> => {
        try {
            const endpoint = `${BASE_MEDIA_PATH}/bulk-delete`;
            return await fetchApi.post<{ deleted_count: number }>(endpoint, { media_ids: mediaIds });
        } catch (error: unknown) {
            console.error(`API Error in bulkDeleteMedia:`, error);
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
    }
};
