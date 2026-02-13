import type { ModuleAction } from "@/types/auth/permission";

export interface RouteRule {
  id: string;
  pattern: RegExp;
  module?: string;
  action?: ModuleAction;
  requiredAnyPermissions?: string[];
  description?: string;
  requireSuperAdmin?: boolean;
}
