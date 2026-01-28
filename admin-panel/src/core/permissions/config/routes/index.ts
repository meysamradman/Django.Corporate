export * from './dashboard';
export * from './media';
export * from './admin';
export * from './users';
export * from './analytics';
export * from './settings';
export * from './blog';
export * from './portfolio';
export * from './realEstate';
export * from './ai';

import { dashboardRoutes } from './dashboard';
import { mediaRoutes } from './media';
import { adminManagementRoutes, roleRoutes } from './admin';
import { userManagementRoutes } from './users';
import { analyticsRoutes } from './analytics';
import { settingsRoutes, miscRoutes, corporateSettingsRoutes } from './settings';
import { blogRoutes } from './blog';
import { portfolioRoutes } from './portfolio';
import { realEstateRoutes } from './realEstate';
import { aiRoutes, communicationRoutes } from './ai';
import type { RouteRule } from '../types';

/**
 * تمام route rules پنل ادمین
 * هر module در فایل جداگانه‌ای تعریف شده است
 */
export const allRouteRules: RouteRule[] = [
  ...dashboardRoutes,
  ...mediaRoutes,
  ...adminManagementRoutes,
  ...userManagementRoutes,
  ...roleRoutes,
  ...analyticsRoutes,
  ...settingsRoutes,
  ...miscRoutes,
  ...blogRoutes,
  ...portfolioRoutes,
  ...realEstateRoutes,
  ...aiRoutes,
  ...communicationRoutes,
  ...corporateSettingsRoutes,
];
