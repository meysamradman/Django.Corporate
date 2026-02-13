import { useMemo } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { usePermission } from "../context/PermissionContext";
import { findRouteRule } from "../config/accessControl";
import { AccessDenied } from "./AccessDenied";

interface RoutePermissionGuardProps {
    children: ReactNode;
}

export function RoutePermissionGuard({ children }: RoutePermissionGuardProps) {
    const location = useLocation();
    const pathname = location.pathname;
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
        return <>{children}</>;
    }

    if (!rule) {
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
        const routeSpecificPermissions = rule.requiredAnyPermissions || [];
        let hasAccess =
            bypassOwnProfile ||
            hasPermission(permissionString) ||
            (rule.module === "admin" && isOwnAdminProfile);

        if (!hasAccess && routeSpecificPermissions.length > 0) {
            hasAccess = routeSpecificPermissions.some((permission) => hasPermission(permission));
        }

        if (!hasAccess && rule.module === "media" && action === "read") {
            hasAccess = hasPermission("media.read") || hasPermission("media.manage");
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

