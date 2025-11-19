'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { usePermissions } from '../utils/permissionUtils';
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
                router.push(fallbackPath);
            }
        }
    }, [isLoading, isAuthenticated, hasRequiredAccess, permission, permissions, fallbackPath, router, user]);

    if (isLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!hasRequiredAccess && (permission || permissions)) {
        return null;
    }

    return <>{children}</>;
}

