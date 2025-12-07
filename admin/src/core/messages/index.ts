// ============================================
// 🔵 CORE IMPORTS - همیشه لازم (نگه دارید)
// ============================================
import { getError, getHttpError, getNetworkError } from './errors';
import { getAuth } from './auth';
import { getValidation } from './validation';
import { getCrud, getAction, getConfirm, getExport, getStatus } from './ui';
import { getAdmin } from './modules/admin';
import { getUser } from './modules/user';
import { getRole } from './modules/role';

// ============================================
// 🟠 CORPORATE IMPORTS - اختیاری (اگر ندارید حذف کنید)
// ============================================
import { getPortfolio } from './modules/portfolio';
import { getBlog } from './modules/blog';
import { getAI, getAIUI } from './modules/ai';

// ============================================
// 🔵 CORE EXPORTS - همیشه لازم (نگه دارید)
// ============================================
export { ERROR_MESSAGES, getError, getHttpError, getNetworkError, shouldUseBackendMessage, isSilentError } from './errors';
export { AUTH_MESSAGES, getAuth } from './auth';
export { VALIDATION_MESSAGES, getValidation } from './validation';
export { CRUD_MESSAGES, ACTION_MESSAGES, CONFIRM_MESSAGES, EXPORT_MESSAGES, STATUS_MESSAGES, getCrud, getAction, getConfirm, getExport, getStatus } from './ui';
export { ADMIN_MESSAGES, getAdmin } from './modules/admin';
export { USER_MESSAGES, getUser } from './modules/user';
export { ROLE_MESSAGES, getRole } from './modules/role';
export { createMessageGetter } from './utils';

// ============================================
// 🟠 CORPORATE EXPORTS - اختیاری (اگر ندارید حذف کنید)
// ============================================
export { PORTFOLIO_MESSAGES, getPortfolio } from './modules/portfolio';
export { BLOG_MESSAGES, getBlog } from './modules/blog';
export { AI_MESSAGES, AI_UI_MESSAGES, getAI, getAIUI } from './modules/ai';

// ============================================
// 📦 MESSAGE GETTER OBJECT
// ============================================
export const msg = {
  // 🔵 CORE - همیشه لازم
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
  admin: getAdmin,
  user: getUser,
  role: getRole,
  
  // 🟠 CORPORATE - اختیاری (اگر ندارید حذف کنید)
  portfolio: getPortfolio,
  blog: getBlog,
  ai: getAI,
  aiUI: getAIUI,
} as const;
