"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { usePermission } from "../context/PermissionContext";
import { findRouteRule } from "../config/accessControl";
import { Button } from "@/components/elements/Button";

interface RoutePermissionGuardProps {
    children: ReactNode;
}

export function RoutePermissionGuard({ children }: RoutePermissionGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoading: authLoading, user } = useAuth();
    const { isLoading: permissionLoading } = usePermission();
    const { hasModuleAction, isSuperAdmin } = useUserPermissions();

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
            <AccessDenied message="این بخش فقط برای سوپر ادمین در دسترس است." />
        );
    }

    if (rule.module) {
        const action = rule.action || "read";
        const bypassOwnProfile =
            rule.module === "admin" &&
            action === "update" &&
            isSelfEditRoute;

        const hasAccess =
            bypassOwnProfile ||
            hasModuleAction(rule.module, action) ||
            (rule.module === "admin" && isOwnAdminProfile);

        if (!hasAccess) {
            return (
                <AccessDenied
                    message={`برای دسترسی به "${rule.description || "این بخش"}" نیاز به مجوز ${action} روی ماژول ${rule.module} دارید.`}
                    onBack={() => router.back()}
                />
            );
        }
    }

    return <>{children}</>;
}

interface AccessDeniedProps {
    message: string;
    onBack?: () => void;
}

function AccessDenied({ message, onBack }: AccessDeniedProps) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="flex flex-col items-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">دسترسی محدود است</h2>
                    <p className="text-sm text-muted-foreground mt-2 leading-6">{message}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => onBack?.()}>
                    بازگشت
                </Button>
                <Button onClick={() => (window.location.href = "/")}>
                    رفتن به داشبورد
                </Button>
            </div>
        </div>
    );
}

