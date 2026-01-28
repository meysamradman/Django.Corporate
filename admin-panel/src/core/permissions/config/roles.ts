import { PERMISSION_TRANSLATIONS } from '@/core/messages/permissions';

export interface RoleConfig {
  name: string;
  display_name: string;
  display_name_short: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  is_system_role: boolean;
}

export const SYSTEM_ROLES: Record<string, RoleConfig> = {

  super_admin: {
    name: 'super_admin',
    display_name: 'Super Admin',
    display_name_short: 'Super Admin',
    description: 'Full system access with all permissions.',
    icon: 'Crown',
    color: 'yellow',
    level: 1,
    is_system_role: true
  },
  media_manager: {
    name: 'media_manager',
    display_name: 'Media Manager',
    display_name_short: 'Media',
    description: 'Handles uploads and the media library.',
    icon: 'Image',
    color: 'orange',
    level: 4,
    is_system_role: true
  },
  settings_manager: {
    name: 'settings_manager',
    display_name: 'Settings Manager',
    display_name_short: 'Settings',
    description: 'Controls global configuration, integrations, and security preferences.',
    icon: 'Settings',
    color: 'gray',
    level: 6,
    is_system_role: true
  },
  panel_manager: {
    name: 'panel_manager',
    display_name: 'Panel Manager',
    display_name_short: 'Panel',
    description: 'Manages admin panel branding, appearance, and panel-level toggles.',
    icon: 'LayoutDashboard',
    color: 'blue',
    level: 6,
    is_system_role: true
  },
  analytics_manager: {
    name: 'analytics_manager',
    display_name: 'Analytics Manager',
    display_name_short: 'Analytics',
    description: 'Manages analytics, statistics, and website/app visit tracking.',
    icon: 'BarChart3',
    color: 'green',
    level: 5,
    is_system_role: true
  },
  user_manager: {
    name: 'user_manager',
    display_name: 'User Manager',
    display_name_short: 'Users',
    description: 'Manages regular website users and profiles without admin access.',
    icon: 'Users',
    color: 'gray',
    level: 7,
    is_system_role: true
  },

  content_manager: {
    name: 'content_manager',
    display_name: 'Content Manager',
    display_name_short: 'Content',
    description: 'Manages portfolios, blogs, taxonomies, and media.',
    icon: 'FileText',
    color: 'blue',
    level: 2,
    is_system_role: false  // غیر سیستمی - در Backend نیست
  },
  blog_manager: {
    name: 'blog_manager',
    display_name: 'Blog Manager',
    display_name_short: 'Blog',
    description: 'Manages blog posts, categories, tags, and related media.',
    icon: 'Newspaper',
    color: 'green',
    level: 3,
    is_system_role: true
  },
  portfolio_manager: {
    name: 'portfolio_manager',
    display_name: 'Portfolio Manager',
    display_name_short: 'Portfolio',
    description: 'Manages portfolio items, categories, tags, and option sets.',
    icon: 'Briefcase',
    color: 'purple',
    level: 3,
    is_system_role: true
  },
  forms_manager: {
    name: 'forms_manager',
    display_name: 'Forms Manager',
    display_name_short: 'Forms',
    description: 'Creates and maintains contact and custom forms.',
    icon: 'FileSpreadsheet',
    color: 'blue',
    level: 4,
    is_system_role: true
  },
  pages_manager: {
    name: 'pages_manager',
    display_name: 'Pages Manager',
    display_name_short: 'Pages',
    description: 'Maintains static pages such as About, Terms, and landing content.',
    icon: 'Layout',
    color: 'purple',
    level: 4,
    is_system_role: true
  },
  email_manager: {
    name: 'email_manager',
    display_name: 'Email Manager',
    display_name_short: 'Email',
    description: 'Manages admin email inbox, templates, and campaigns.',
    icon: 'Mail',
    color: 'orange',
    level: 5,
    is_system_role: true
  },
  ticket_manager: {
    name: 'ticket_manager',
    display_name: 'Ticket Manager',
    display_name_short: 'Ticket',
    description: 'Manages support tickets, responses, and customer inquiries.',
    icon: 'Ticket',
    color: 'blue',
    level: 5,
    is_system_role: true
  },
  chatbot_manager: {
    name: 'chatbot_manager',
    display_name: 'Chatbot Manager',
    display_name_short: 'Chatbot',
    description: 'Manages chatbot settings, FAQs, and automated responses.',
    icon: 'MessageSquare',
    color: 'purple',
    level: 4,  // تغییر از 5 به 4 برای Sync با Backend
    is_system_role: true
  },
  ai_manager: {
    name: 'ai_manager',
    display_name: 'AI Manager',
    display_name_short: 'AI',
    description: 'Controls AI tools, prompts, providers, and generated assets.',
    icon: 'Bot',
    color: 'green',
    level: 5,
    is_system_role: true
  },
  real_estate_manager: {
    name: 'real_estate_manager',
    display_name: 'Real Estate Manager',
    display_name_short: 'Real Estate',
    description: 'Manages properties, agents, agencies, and real estate taxonomies.',
    icon: 'Building',
    color: 'blue',
    level: 3,
    is_system_role: true
  },
};

export const getRoleConfig = (roleName: string): RoleConfig | null => {
  return SYSTEM_ROLES[roleName] || null;
};

export const getRoleDisplayName = (roleName: string, short: boolean = false): string => {
  const persianName = PERMISSION_TRANSLATIONS.roleNames[roleName as keyof typeof PERMISSION_TRANSLATIONS.roleNames];
  if (persianName) {
    return persianName;
  }

  const config = getRoleConfig(roleName);
  if (!config) return roleName;

  return short ? config.display_name_short : config.display_name;
};

export const getRoleIcon = (roleName: string): string => {
  const config = getRoleConfig(roleName);
  return config?.icon || 'UserCheck';
};

export const getRoleColor = (roleName: string): string => {
  const config = getRoleConfig(roleName);
  return config?.color || 'gray';
};

export const isSuperAdmin = (user: any): boolean => {
  return user?.is_super ||
    user?.is_superuser ||
    user?.roles?.some((role: any) =>
      role === 'super_admin' || role?.name === 'super_admin'
    );
};

export const getUserRoleDisplayText = (user: any): string => {
  if (!user) return 'بدون نقش';

  const roles = user.roles || [];
  let roleText = 'بدون نقش';

  if (isSuperAdmin(user)) {
    roleText = getRoleDisplayName('super_admin', true);
  } else if (roles.length > 0) {
    const mainRole = roles[0];
    if (typeof mainRole === 'object' && mainRole?.display_name) {
      roleText = mainRole.display_name;
    } else {
      const roleName = typeof mainRole === 'string' ? mainRole : mainRole?.name;
      if (roleName) {
        roleText = getRoleDisplayName(roleName, true);
      } else {
        roleText = `${roles.length} نقش`;
      }
    }
  }

  let typeText = '';
  if (user?.user_role_type === 'admin') {
    typeText = 'ادمین';
  } else if (user?.user_role_type === 'consultant') {
    typeText = 'مشاور';
  }

  if (typeText) {
    return `${roleText} | ${typeText}`;
  }

  return roleText;
};

export const getSystemRoles = (): RoleConfig[] => {
  return Object.values(SYSTEM_ROLES).sort((a, b) => a.level - b.level);
};

export const getAvailableRoles = (currentUserLevel: number = 10): RoleConfig[] => {
  return getSystemRoles().filter(role => role.level > currentUserLevel);
};

export const ROLE_COLORS = {
  yellow: {
    bg: 'bg-yellow',
    text: 'text-yellow-2',
    border: 'border-yellow-1'
  },
  blue: {
    bg: 'bg-blue',
    text: 'text-blue-2',
    border: 'border-blue-1'
  },
  green: {
    bg: 'bg-green',
    text: 'text-green-2',
    border: 'border-green-1'
  },
  purple: {
    bg: 'bg-purple',
    text: 'text-purple-2',
    border: 'border-purple-1'
  },
  orange: {
    bg: 'bg-orange',
    text: 'text-orange-2',
    border: 'border-orange-1'
  },
  gray: {
    bg: 'bg-gray',
    text: 'text-gray-2',
    border: 'border-gray-1'
  }
};

export const getRoleColorClasses = (roleName: string) => {
  const color = getRoleColor(roleName);
  return ROLE_COLORS[color as keyof typeof ROLE_COLORS] || ROLE_COLORS.gray;
};

