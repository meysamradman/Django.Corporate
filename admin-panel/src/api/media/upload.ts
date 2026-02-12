import { csrfManager } from '@/core/auth/session';
import { env } from '@/core/config/environment';
import type { Media } from '@/types/shared/media';
import type { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { BASE_MEDIA_PATH } from './constants';

interface UploadOptions {
    onProgress?: (progress: number) => void;
    cookieHeader?: string;
    signal?: AbortSignal;
}

export async function uploadMedia(formData: FormData, options?: UploadOptions): Promise<ApiResponse<Media>> {
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

                    try {
                        const errorData = JSON.parse(xhr.responseText);
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
        let message = 'Failed to upload media';
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
}