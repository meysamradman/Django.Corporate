import { resolveAIErrorMessage } from '@/core/messages/modules/ai';

export const throwAIError = (error: unknown): never => {
    const message = resolveAIErrorMessage(error);
    throw new Error(message);
};
