import { getError, getHttpError, getNetworkError } from './errors';
import { getAuth } from './auth';
import { getValidation } from './validation';
import { getCrud, getAction, getConfirm, getExport, getStatus } from './ui';
import { getPortfolio } from './modules/portfolio';
import { getBlog } from './modules/blog';
import { getAdmin } from './modules/admin';
import { getUser } from './modules/user';
import { getRole } from './modules/role';
import { getAI, getAIUI } from './modules/ai';

export { ERROR_MESSAGES, getError, getHttpError, getNetworkError, shouldUseBackendMessage, isSilentError } from './errors';
export { AUTH_MESSAGES, getAuth } from './auth';
export { VALIDATION_MESSAGES, getValidation } from './validation';
export { CRUD_MESSAGES, ACTION_MESSAGES, CONFIRM_MESSAGES, EXPORT_MESSAGES, STATUS_MESSAGES, getCrud, getAction, getConfirm, getExport, getStatus } from './ui';
export { PORTFOLIO_MESSAGES, getPortfolio } from './modules/portfolio';
export { BLOG_MESSAGES, getBlog } from './modules/blog';
export { ADMIN_MESSAGES, getAdmin } from './modules/admin';
export { USER_MESSAGES, getUser } from './modules/user';
export { ROLE_MESSAGES, getRole } from './modules/role';
export { AI_MESSAGES, AI_UI_MESSAGES, getAI, getAIUI } from './modules/ai';
export { createMessageGetter } from './utils';

export const msg = {
  error: getError,
  httpError: getHttpError,
  networkError: getNetworkError,
  auth: getAuth,
  validation: getValidation,
  crud: getCrud,
  action: getAction,
  confirm: getConfirm,
  export: getExport,
  status: getStatus,
  portfolio: getPortfolio,
  blog: getBlog,
  admin: getAdmin,
  user: getUser,
  role: getRole,
  ai: getAI,
  aiUI: getAIUI,
} as const;
