"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/core/auth/AuthContext";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { usePermission } from "../context/PermissionContext";
import { findRouteRule } from "../config/accessControl";
import { Spinner } from "@/components/elements/Spinner";
import { AccessDenied } from "./AccessDenied";

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

    if (isLoading) {
        return (
            <div className="w-full h-full min-h-[50vh] flex items-center justify-center">
                <Spinner className="size-8 text-primary" />
            </div>
        );
    }

    if (!rule) {
        return <>{children}</>;
    }

    // Skip permission check for create pages - handled by ProtectedButton with Toast
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

        // ✅ FIX: Use hasPermission which checks wildcards, manage, and synonyms
        const permissionString = `${rule.module}.${action}`;
        let hasAccess =
            bypassOwnProfile ||
            hasPermission(permissionString) ||
            (rule.module === "admin" && isOwnAdminProfile);

        // ✅ AI-specific permission check: Support sub-permissions
        if (!hasAccess && rule.module === "ai" && action === "manage") {
            // Map paths to specific permissions
            const aiPermissionMap: Record<string, string[]> = {
                "/ai/chat": ["ai.chat.manage", "ai.manage"],
                "/ai/content": ["ai.content.manage", "ai.manage"],
                "/ai/image": ["ai.image.manage", "ai.manage"],
                "/settings/my-ai": [
                    "ai.settings.personal.manage",
                    "ai.chat.manage",
                    "ai.content.manage",
                    "ai.image.manage",
                    "ai.manage"
                ],
                "/settings/ai": [
                    "ai.settings.shared.manage",
                    "ai.manage",
                    "ai.chat.manage",
                    "ai.content.manage",
                    "ai.image.manage",
                    "ai.audio.manage"
                ],
            };
            
            // Find matching path and check permissions
            for (const [pathPrefix, perms] of Object.entries(aiPermissionMap)) {
                if (pathname?.startsWith(pathPrefix)) {
                    hasAccess = perms.some(perm => hasPermission(perm));
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

