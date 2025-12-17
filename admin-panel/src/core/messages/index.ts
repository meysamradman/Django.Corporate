import { getValidation } from './validation';
import { getAuth } from './auth';
import { getError } from './errors';

export const msg = {
  validation: getValidation,
  auth: getAuth,
  error: getError,
} as const;

