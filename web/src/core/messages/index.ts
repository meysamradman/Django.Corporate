import { getError, getHttpError, getNetworkError } from './errors';
import { getValidation } from './validation';
import { getStatus, getAction } from './ui';
import { getPortfolio } from './modules/portfolio';
import { getBlog } from './modules/blog';
export { ERROR_MESSAGES, getError, getHttpError, getNetworkError, shouldUseBackendMessage, isSilentError } from './errors';
export { VALIDATION_MESSAGES, getValidation } from './validation';
export { STATUS_MESSAGES, getStatus, ACTION_MESSAGES, getAction } from './ui';
export { createMessageGetter } from './utils';
export { PORTFOLIO_MESSAGES, getPortfolio } from './modules/portfolio';
export { BLOG_MESSAGES, getBlog } from './modules/blog';
export const msg = {
  error: getError,
  httpError: getHttpError,
  networkError: getNetworkError,
  validation: getValidation,
  status: getStatus,
  action: getAction,
  portfolio: getPortfolio,
  blog: getBlog,
} as const;
