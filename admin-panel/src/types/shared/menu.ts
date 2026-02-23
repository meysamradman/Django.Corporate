import type { Icon } from "@phosphor-icons/react";

export interface MenuBadge {
  label: string;
  tone: "info" | "warning" | "muted";
}

export interface MenuAccessConfig {
  module?: string;
  actions?: string[];
  fallbackModules?: string[];
  hideIfNoAccess?: boolean;
  allowReadOnly?: boolean;
  readOnlyLabel?: string;
  limitedLabel?: string;
  requireSuperAdmin?: boolean;
  hideForSuperAdmin?: boolean;
  roles?: string[];
}

export interface MenuItem {
  title: string;
  url?: string;
  icon?: Icon;
  items?: MenuItem[];
  isTitle?: boolean;
  disabled?: boolean;
  access?: MenuAccessConfig;
  badge?: MenuBadge;
  state?: "full" | "readOnly" | "limited" | "locked";
  tooltip?: string;
  onClick?: () => void;
}

export type MenuGroup = {
  title: string;
  items: MenuItem[];
};
