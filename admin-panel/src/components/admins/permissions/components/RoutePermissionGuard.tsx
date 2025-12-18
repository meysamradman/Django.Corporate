"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/core/auth/AuthContext";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { usePermission } from "../context/PermissionContext";
import { findRouteRule } from "../config/accessControl";
import { AccessDenied } from "./AccessDenied";
import { PERMISSIONS } from "@/core/permissions/constants";

interface RoutePermissionGuardProps {
    children: ReactNode;
}

export function RoutePermissionGuard({ children }: RoutePermissionGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoading: authLoading, user } = useAuth();
    const { isLoading: permissionLoading, hasPermission } = usePermission();
    const { isSuperAdmin } = useUserPermissions();

    const rule = useMemo(() => {
        if (!pathname) return undefined;
        return findRouteRule(pathname);
    }, [pathname]);

    const isOwnAdminProfile = useMemo(() => {
        if (!user?.id || !pathname) return false;
        const match = pathname.match(/^\/admins\/(\d+)\/edit$/);
        if (!match) return false;
        return String(user.id) === match[1];
    }, [pathname, user?.id]);

    const isSelfEditRoute = useMemo(() => {
        if (!user?.id || !pathname) return false;
        if (pathname === "/admins/me/edit") return true;
        return isOwnAdminProfile;
    }, [pathname, user?.id, isOwnAdminProfile]);

    const isLoading = authLoading || permissionLoading;

    // Loading را به کامپوننت‌های خود صفحه واگذار می‌کنیم
    if (isLoading) {
        return <>{children}</>;
    }

    if (!rule) {
        return <>{children}</>;
    }

    if (pathname === '/portfolios/create' || pathname === '/blogs/create') {
        return <>{children}</>;
    }

    if (rule.requireSuperAdmin && !isSuperAdmin) {
        return (
            <AccessDenied 
                message="این بخش فقط برای سوپر ادمین در دسترس است."
                showBackButton={true}
                showDashboardButton={true}
            />
        );
    }

    if (rule.module) {
        const action = rule.action || "read";
        const bypassOwnProfile =
            rule.module === "admin" &&
            action === "update" &&
            isSelfEditRoute;

        const permissionString = `${rule.module}.${action}`;
        let hasAccess =
            bypassOwnProfile ||
            hasPermission(permissionString) ||
            (rule.module === "admin" && isOwnAdminProfile);

        if (!hasAccess && rule.module === "ai" && action === "manage") {
            // AI Permission Map using constants
            const aiPermissionMap: Record<string, string[]> = {
                "/ai/chat": [PERMISSIONS.AI.CHAT_MANAGE, PERMISSIONS.AI.MANAGE],
                "/ai/content": [PERMISSIONS.AI.CONTENT_MANAGE, PERMISSIONS.AI.MANAGE],
                "/ai/image": [PERMISSIONS.AI.IMAGE_MANAGE, PERMISSIONS.AI.MANAGE],
                "/ai/audio": [PERMISSIONS.AI.AUDIO_MANAGE, PERMISSIONS.AI.MANAGE],
                "/ai/models": [PERMISSIONS.AI.MANAGE],
                "/ai/settings": [
                    PERMISSIONS.AI.SETTINGS_PERSONAL_MANAGE,
                    PERMISSIONS.AI.SETTINGS_SHARED_MANAGE,
                    PERMISSIONS.AI.MANAGE
                ],
                "/settings/my-ai": [
                    PERMISSIONS.AI.SETTINGS_PERSONAL_MANAGE,
                    PERMISSIONS.AI.CHAT_MANAGE,
                    PERMISSIONS.AI.CONTENT_MANAGE,
                    PERMISSIONS.AI.IMAGE_MANAGE,
                    PERMISSIONS.AI.MANAGE
                ],
                "/settings/ai": [
                    PERMISSIONS.AI.SETTINGS_SHARED_MANAGE,
                    PERMISSIONS.AI.MANAGE,
                    PERMISSIONS.AI.CHAT_MANAGE,
                    PERMISSIONS.AI.CONTENT_MANAGE,
                    PERMISSIONS.AI.IMAGE_MANAGE,
                    PERMISSIONS.AI.AUDIO_MANAGE
                ],
            };
            
            for (const [pathPrefix, perms] of Object.entries(aiPermissionMap)) {
                if (pathname?.startsWith(pathPrefix)) {
                    // برای /ai/models فقط سوپر ادمین
                    if (pathPrefix === "/ai/models") {
                        hasAccess = isSuperAdmin;
                    } else {
                        hasAccess = perms.some(perm => hasPermission(perm));
                    }
                    break;
                }
            }
        }

        if (!hasAccess) {
            return (
                <AccessDenied
                    permission={permissionString}
                    module={rule.module}
                    action={action}
                    description={rule.description}
                    showBackButton={true}
                    showDashboardButton={true}
                />
            );
        }
    }

    return <>{children}</>;
}

