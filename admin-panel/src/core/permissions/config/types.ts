import type { ModuleAction } from "@/types/auth/permission";

export interface RouteRule {
  id: string;
  pattern: RegExp;
  module?: string;
  action?: ModuleAction;
  description?: string;
  requireSuperAdmin?: boolean;
}
