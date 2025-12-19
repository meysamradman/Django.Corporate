import { getError } from './errors';
import { getValidation } from './validation';
import { getCrud, getAction, getConfirm, getExport, getStatus, getAuth } from './ui';
import { getPortfolio } from './modules/portfolio';
import { getBlog } from './modules/blog';
import { getAI, getAIUI } from './modules/ai';
import { translatePagePath, PAGE_PATH_TRANSLATIONS } from './analytics';
export { getValidation } from './validation';
export { getError } from './errors';
export { getCrud, getAction, getConfirm, getExport, getStatus, getAuth } from './ui';
export { PORTFOLIO_MESSAGES, getPortfolio } from './modules/portfolio';
export { BLOG_MESSAGES, getBlog } from './modules/blog';
export { AI_MESSAGES, AI_UI_MESSAGES, getAI, getAIUI } from './modules/ai';
export { PAGE_PATH_TRANSLATIONS, translatePagePath } from './analytics';

export const msg = {
  error: getError,
  auth: getAuth,
  validation: getValidation,
  crud: getCrud,
  action: getAction,
  confirm: getConfirm,
  export: getExport,
  status: getStatus,
  portfolio: getPortfolio,
  blog: getBlog,
  ai: getAI,
  aiUI: getAIUI,
  pagePath: translatePagePath,
} as const;

