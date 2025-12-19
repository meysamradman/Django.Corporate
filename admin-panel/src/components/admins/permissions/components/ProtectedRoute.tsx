import React, { useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { usePermissions } from '../utils/permissionUtils';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

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
                navigate(fallbackPath);
            }
        }
    }, [isLoading, isAuthenticated, hasRequiredAccess, permission, permissions, fallbackPath, navigate, user]);

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

