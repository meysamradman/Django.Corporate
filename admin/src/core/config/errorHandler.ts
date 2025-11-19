import {ApiError} from '@/types/api/apiError';
import { toast } from '@/components/elements/Sonner';
import { getErrorMessage, getUIMessage, getValidationMessage } from '@/core/messages/message'

export const isServer = typeof window === 'undefined';

const HttpErrorType = {
    CLIENT_ERROR: 'CLIENT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

const ErrorMessages = {
    NETWORK_ERROR: getErrorMessage('network'),
    SERVER_ERROR: getErrorMessage('serverError'),
    UNAUTHORIZED: getErrorMessage('unauthorized'),
    FORBIDDEN: getErrorMessage('forbidden'),
    BAD_REQUEST: getErrorMessage('validation'),
    NOT_FOUND: getErrorMessage('notFound'),
    UNKNOWN_ERROR: getErrorMessage('unknownError')
} as const;

function getErrorType(statusCode: number): keyof typeof HttpErrorType {
    if (statusCode >= 400 && statusCode < 500) {
        if (statusCode === 422) {
            return HttpErrorType.VALIDATION_ERROR;
        }
        return HttpErrorType.CLIENT_ERROR;
    } else if (statusCode >= 500) {
        return HttpErrorType.SERVER_ERROR;
    }
    return HttpErrorType.UNKNOWN_ERROR;
}

function getUserMessage(error: ApiError): string {
    // اگر پیام خطا از بک‌اند موجود باشد، از آن استفاده کن
    if (error.response.message) {
        return error.response.message;
    }
    
    if (error.response.AppStatusCode === 401) {
        return ErrorMessages.UNAUTHORIZED;
    }
    
    switch (error.response.AppStatusCode) {
        case 403:
            return ErrorMessages.FORBIDDEN;
        case 404:
            return ErrorMessages.NOT_FOUND;
        case 400:
        case 422:
            return ErrorMessages.BAD_REQUEST;
        case 500:
            return ErrorMessages.SERVER_ERROR;
        default:
            const errorType = getErrorType(error.response.AppStatusCode);
            switch (errorType) {
                case HttpErrorType.CLIENT_ERROR:
                    return ErrorMessages.BAD_REQUEST;
                case HttpErrorType.SERVER_ERROR:
                    return ErrorMessages.SERVER_ERROR;
                case HttpErrorType.NETWORK_ERROR:
                    return ErrorMessages.NETWORK_ERROR;
                default:
                    return ErrorMessages.UNKNOWN_ERROR;
            }
    }
}

/**
 * استخراج خطاهای فیلدها از پاسخ Django
 * 
 * @param error - خطای API
 * @returns آبجکتی شامل خطاهای هر فیلد
 * 
 * @example
 * const fieldErrors = extractFieldErrors(error);
 * // { name: "این فیلد الزامی است", slug: "این مقدار قبلاً استفاده شده است" }
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    
    if (error instanceof ApiError) {
        // Django validation errors
        if (error.response.AppStatusCode === 400 || error.response.AppStatusCode === 422) {
            const data = error.response._data;
            
            // Check if data has field-level errors
            if (data && typeof data === 'object') {
                Object.entries(data).forEach(([field, messages]) => {
                    if (Array.isArray(messages) && messages.length > 0) {
                        // اولین پیام خطا را برمی‌گردانیم
                        fieldErrors[field] = messages[0];
                    } else if (typeof messages === 'string') {
                        fieldErrors[field] = messages;
                    }
                });
            }
        }
    }
    
    return fieldErrors;
}

/**
 * بررسی اینکه آیا خطا شامل field-level errors است
 */
export function hasFieldErrors(error: unknown): boolean {
    const fieldErrors = extractFieldErrors(error);
    return Object.keys(fieldErrors).length > 0;
}

export function handleApiError(error: unknown, customMessage?: string): string {
    let errorMessage = customMessage || ErrorMessages.UNKNOWN_ERROR;
    
    if (error instanceof ApiError) {
        errorMessage = getUserMessage(error);
        if (getErrorType(error.response.AppStatusCode) === HttpErrorType.VALIDATION_ERROR) {
            // Handle validation errors specifically if needed
        }
    } else if (error instanceof Error) {
        errorMessage = error.message || ErrorMessages.NETWORK_ERROR;
    }
    
    return errorMessage;
}

export function showErrorToast(error: unknown, customMessage?: string): void {
    const message = handleApiError(error, customMessage);
    
    if (error instanceof ApiError && error.response.AppStatusCode === 401) {
                return; 
    }

    if (isServer) {
        return;
    }

    toast.error(getUIMessage('error'), {
        description: message,
    });
}

export function showSuccessToast(message: string): void {
    if (isServer) {

        return;
    }

    toast.success(getUIMessage('success'), {
        description: message,
    });
}

export function showValidationToast(validationKey: keyof typeof import('@/core/messages/message').VALIDATION_MESSAGES, params?: Record<string, string | number>): void {
    if (isServer) {
                return;
    }

    const message = getValidationMessage(validationKey, params);
    
    toast.warning(getErrorMessage('validation'), {
        description: message,
    });
}

export function wrapServiceCall<T>(
    servicePromise: Promise<T>,
    options?: {
        errorMessage?: string;
        showToast?: boolean;
    }
): Promise<T> {
    return servicePromise.catch((error) => {
        const message = handleApiError(error, options?.errorMessage);
        let shouldShowToast = options?.showToast !== false;

        if (error instanceof ApiError && error.response.AppStatusCode === 401) {
            shouldShowToast = false; 
        }
        
        if (shouldShowToast && !isServer) {
            showErrorToast(error, options?.errorMessage);
        }
        
        throw error;
    });
} 