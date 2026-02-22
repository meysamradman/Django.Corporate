import { getError } from './errors';
import { getValidation } from './validation';
import { getCrud, getAction, getConfirm, getExport, getStatus, getAuth, getSecurity, getEmailAction } from './ui';
import { getPortfolio } from './modules/portfolio';
import { getBlog } from './modules/blog';
import { getAI, getAIUI } from './modules/ai';
import { getRealEstate } from './modules/real_estate';
import { translatePagePath } from './analytics';
export { getValidation } from './validation';
export { getError } from './errors';
export { getCrud, getAction, getConfirm, getExport, getStatus, getAuth, getSecurity, getEmailAction } from './ui';
export { PORTFOLIO_MESSAGES, getPortfolio } from './modules/portfolio';
export { BLOG_MESSAGES, getBlog } from './modules/blog';
export { AI_MESSAGES, AI_UI_MESSAGES, getAI, getAIUI } from './modules/ai';
export { REAL_ESTATE_MESSAGES, getRealEstate } from './modules/real_estate';
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
  security: getSecurity,
  emailAction: getEmailAction,
  portfolio: getPortfolio,
  blog: getBlog,
  ai: getAI,
  aiUI: getAIUI,
  realEstate: getRealEstate,
  pagePath: translatePagePath,
} as const;

