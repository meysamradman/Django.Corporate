'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { usePermissions } from '@/core/auth/permissionUtils';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    fallbackPath?: string;
}

export function ProtectedRoute({
    children,
    permission,
    permissions,
    requireAll = false,
    fallbackPath = '/login'
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();
    const router = useRouter();

    let hasRequiredAccess = false;
    if (user?.is_superuser) {
        hasRequiredAccess = true;
    } else if (permission || permissions) {
        if (permission) {
            hasRequiredAccess = hasPermission(permission);
        } else if (permissions) {
            hasRequiredAccess = requireAll 
                ? hasAllPermissions(permissions) 
                : hasAnyPermission(permissions);
        }
    } else {
        hasRequiredAccess = true;
    }

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated && !hasRequiredAccess && (permission || permissions)) {
                console.warn(`[ProtectedRoute] useEffect: Access denied for user ${user?.email || user?.mobile}. Required: ${permission || permissions?.join(', ')}. Redirecting to ${fallbackPath}`);
                router.push(fallbackPath);
            }
        }
    }, [isLoading, isAuthenticated, hasRequiredAccess, permission, permissions, fallbackPath, router, user]);

    if (isLoading) {
        console.debug("[ProtectedRoute] isLoading is true, returning null.");
        return null;
    }

    if (!isAuthenticated) {
        console.debug("[ProtectedRoute] Not authenticated, returning null (AuthContext should redirect).");
        return null;
    }

    if (!hasRequiredAccess && (permission || permissions)) {
        console.debug("[ProtectedRoute] Access denied, returning null (useEffect should redirect).");
        return null;
    }

    console.debug("[ProtectedRoute] Access granted, rendering children.");
    return <>{children}</>;
} 