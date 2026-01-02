import type { RouteRule } from "../types";

const ID_SEGMENT = "[0-9a-zA-Z-]+";
const createRule = (config: RouteRule): RouteRule => config;

export const aiRoutes: RouteRule[] = [
  createRule({
    id: "ai-chat",
    pattern: /^\/ai\/chat\/?$/,
    module: 'ai',
    action: "manage",
    description: "چت هوشمند",
  }),
  createRule({
    id: "ai-content",
    pattern: /^\/ai\/content\/?$/,
    module: 'ai',
    action: "manage",
    description: "تولید محتوا",
  }),
  createRule({
    id: "ai-image",
    pattern: /^\/ai\/image\/?$/,
    module: 'ai',
    action: "manage",
    description: "تولید تصویر",
  }),
  createRule({
    id: "ai-audio",
    pattern: /^\/ai\/audio\/?$/,
    module: 'ai',
    action: "manage",
    description: "تولید پادکست",
  }),
  createRule({
    id: "ai-models",
    pattern: /^\/ai\/models\/?$/,
    module: 'ai',
    action: "manage",
    description: "انتخاب مدل‌های AI (فقط سوپر ادمین)",
    requireSuperAdmin: true,
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
