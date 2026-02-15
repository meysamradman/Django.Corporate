import { resolveAIErrorMessage } from '@/core/messages/modules/ai';
import { ApiError } from '@/types/api/apiError';

export const throwAIError = (error: unknown): never => {
    const message = resolveAIErrorMessage(error);
    throw ApiError.fromMessage(message, 500, error);
};
