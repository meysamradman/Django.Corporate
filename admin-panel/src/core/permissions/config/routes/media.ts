import type { RouteRule } from "../types";

const ID_SEGMENT = "[0-9a-zA-Z-]+";
const createRule = (config: RouteRule): RouteRule => config;

export const mediaRoutes: RouteRule[] = [
  createRule({
    id: "media-list",
    pattern: /^\/media\/?$/,
    module: 'media',
    action: "read",
    description: "Media library - requires media.read or media.manage permission",
  }),
  createRule({
    id: "media-detail",
    pattern: new RegExp(`^/media/${ID_SEGMENT}/?$`),
    module: 'media',
    action: "update",
    description: "Media details - requires media.update permission",
  }),
];
