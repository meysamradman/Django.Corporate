import type { RouteRule } from "../types";
import { PERMISSIONS } from "../../constants";

const ID_SEGMENT = "[0-9a-zA-Z-]+";
const createRule = (config: RouteRule): RouteRule => config;

export const aiRoutes: RouteRule[] = [
  createRule({
    id: "ai-chat",
    pattern: /^\/ai\/chat\/?$/,
    module: 'ai',
    action: "manage",
    requiredAnyPermissions: [PERMISSIONS.AI.CHAT_MANAGE, PERMISSIONS.AI.MANAGE],
    description: "چت هوشمند",
  }),
  createRule({
    id: "ai-content",
    pattern: /^\/ai\/content\/?$/,
    module: 'ai',
    action: "manage",
    requiredAnyPermissions: [PERMISSIONS.AI.CONTENT_MANAGE, PERMISSIONS.AI.MANAGE],
    description: "تولید محتوا",
  }),
  createRule({
    id: "ai-image",
    pattern: /^\/ai\/image\/?$/,
    module: 'ai',
    action: "manage",
    requiredAnyPermissions: [PERMISSIONS.AI.IMAGE_MANAGE, PERMISSIONS.AI.MANAGE],
    description: "تولید تصویر",
  }),
  createRule({
    id: "ai-audio",
    pattern: /^\/ai\/audio\/?$/,
    module: 'ai',
    action: "manage",
    requiredAnyPermissions: [PERMISSIONS.AI.AUDIO_MANAGE, PERMISSIONS.AI.MANAGE],
    description: "تولید پادکست",
  }),
  createRule({
    id: "ai-settings",
    pattern: /^\/ai\/settings\/?$/,
    module: 'ai',
    action: "manage",
    requiredAnyPermissions: [
      PERMISSIONS.AI.SETTINGS_PERSONAL_MANAGE,
      PERMISSIONS.AI.SETTINGS_SHARED_MANAGE,
      PERMISSIONS.AI.MANAGE,
    ],
    description: "تنظیمات Providerها و API Key",
  }),
  createRule({
    id: "ai-models",
    pattern: /^\/ai\/models\/?$/,
    module: 'ai',
    action: "manage",
    requiredAnyPermissions: [PERMISSIONS.AI.MODELS_MANAGE],
    description: "انتخاب مدل‌های AI (فقط سوپر ادمین)",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "settings-ai-shared",
    pattern: /^\/settings\/ai\/?$/,
    module: 'ai',
    action: "manage",
    requiredAnyPermissions: [
      PERMISSIONS.AI.SETTINGS_SHARED_MANAGE,
      PERMISSIONS.AI.MANAGE,
      PERMISSIONS.AI.CHAT_MANAGE,
      PERMISSIONS.AI.CONTENT_MANAGE,
      PERMISSIONS.AI.IMAGE_MANAGE,
      PERMISSIONS.AI.AUDIO_MANAGE,
    ],
    description: "تنظیمات AI در بخش تنظیمات",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "settings-ai-personal",
    pattern: /^\/settings\/my-ai\/?$/,
    module: 'ai',
    action: "manage",
    requiredAnyPermissions: [
      PERMISSIONS.AI.SETTINGS_PERSONAL_MANAGE,
      PERMISSIONS.AI.CHAT_MANAGE,
      PERMISSIONS.AI.CONTENT_MANAGE,
      PERMISSIONS.AI.IMAGE_MANAGE,
      PERMISSIONS.AI.MANAGE,
    ],
    description: "تنظیمات شخصی AI",
  }),
];

export const communicationRoutes: RouteRule[] = [
  createRule({
    id: "email-list",
    pattern: /^\/email\/?$/,
    module: 'email',
    action: "read",
    description: "لیست ایمیل‌ها",
  }),
  createRule({
    id: "email-view",
    pattern: new RegExp(`^/email/${ID_SEGMENT}/?$`),
    module: 'email',
    action: "read",
    description: "مشاهده ایمیل",
  }),
  createRule({
    id: "ticket-list",
    pattern: /^\/ticket\/?$/,
    module: 'ticket',
    action: "read",
    description: "لیست تیکت‌ها",
  }),
  createRule({
    id: "ticket-create",
    pattern: /^\/ticket\/create\/?$/,
    module: 'ticket',
    action: "create",
    description: "ایجاد تیکت",
  }),
  createRule({
    id: "ticket-view",
    pattern: new RegExp(`^/ticket/${ID_SEGMENT}/?$`),
    module: 'ticket',
    action: "read",
    description: "مشاهده تیکت",
  }),
  createRule({
    id: "ticket-edit",
    pattern: new RegExp(`^/ticket/${ID_SEGMENT}/edit/?$`),
    module: 'ticket',
    action: "update",
    description: "ویرایش تیکت",
  }),
];
