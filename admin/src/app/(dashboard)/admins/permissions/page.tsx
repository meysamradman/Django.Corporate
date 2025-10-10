"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Checkbox } from "@/components/elements/Checkbox";
import { Separator } from "@/components/elements/Separator";
import { Search, Shield, Users, Settings, Eye, Save, Loader2 } from "lucide-react";
import { useRoles, usePermissions } from "@/components/auth/hooks/useRoles";
import { useUserPermissions } from "@/components/auth/hooks/usePermissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Skeleton } from "@/components/elements/Skeleton";
import { toast } from "@/components/elements/Sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/elements/AlertDialog";

interface PermissionGroup {
  resource: string;
  permissions: Array<{
    id: number;
    resource: string;
    action: string;
    description?: string;
  }>;
}

interface RoleWithPermissions {
  id: number;
  name: string;
  description?: string;
  is_protected: boolean;
  permissions: Array<{
    id: number;
    resource: string;
    action: string;
  }>;
}

export default function PermissionsManagementPage() {
  const { hasPermission } = useUserPermissions();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [modifiedPermissions, setModifiedPermissions] = useState<Set<number>>(new Set());
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const roles = rolesData?.data || [];
  const permissionGroups = permissionsData || [];

  // Filter roles based on search
  const filteredRoles = roles.filter((role: RoleWithPermissions) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group permissions by resource
  const groupedPermissions = React.useMemo(() => {
    if (!Array.isArray(permissionGroups)) return {};
    
    const groups: Record<string, Array<{id: number, resource: string, action: string, description?: string}>> = {};
    
    permissionGroups.forEach((group: PermissionGroup) => {
      if (group.permissions) {
        groups[group.resource] = group.permissions;
      }
    });

    return groups;
  }, [permissionGroups]);

  // Check if role has specific permission
  const roleHasPermission = (role: RoleWithPermissions, permissionId: number): boolean => {
    return role.permissions?.some(perm => perm.id === permissionId) || false;
  };

  // Toggle permission for selected role
  const togglePermission = (permissionId: number) => {
    if (!selectedRole) return;

    const newModified = new Set(modifiedPermissions);
    newModified.add(permissionId);
    setModifiedPermissions(newModified);

    // Update selected role permissions in state
    const currentHasPermission = roleHasPermission(selectedRole, permissionId);
    const updatedPermissions = currentHasPermission
      ? selectedRole.permissions.filter(p => p.id !== permissionId)
      : [...selectedRole.permissions, { id: permissionId, resource: "", action: "" }];

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions
    });
  };

  // Save permission changes
  const handleSaveChanges = async () => {
    if (!selectedRole || modifiedPermissions.size === 0) return;

    setIsSaving(true);
    try {
      // Here you would call the API to update role permissions
      // await updateRolePermissions(selectedRole.id, selectedRole.permissions);
      
      toast.success("تغییرات با موفقیت ذخیره شد");
      setModifiedPermissions(new Set());
      setSaveDialogOpen(false);
    } catch (error) {
      toast.error("خطا در ذخیره تغییرات");
      console.error("Save permissions error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Permission resource icons
  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'admin':
      case 'admin.roles':
        return <Users className="h-4 w-4" />;
      case 'media':
        return <Eye className="h-4 w-4" />;
      case 'panel':
      case 'statistics.admin':
        return <Settings className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  // Permission action colors
  const getActionColor = (action: string) => {
    switch (action) {
      case 'view':
      case 'list':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'edit':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'manage':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
                      <h1 className="page-title">مدیریت دسترسی‌ها</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate 
      permission="admin.roles.manage" 
      fallback={
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground">
            دسترسی محدود
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            شما دسترسی لازم برای مدیریت نقش‌ها و دسترسی‌ها را ندارید.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">مدیریت دسترسی‌ها</h1>
          </div>
          {modifiedPermissions.size > 0 && (
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              ذخیره تغییرات ({modifiedPermissions.size})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">نقش‌ها</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو در نقش‌ها..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Roles */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRoles.map((role: RoleWithPermissions) => (
                    <div
                      key={role.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRole?.id === role.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedRole(role);
                        setModifiedPermissions(new Set());
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm">{role.name}</h3>
                          {role.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                        {role.is_protected && (
                          <Badge variant="secondary" className="text-xs">
                            محافظت شده
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {role.permissions?.length || 0} دسترسی
                        </span>
                        <Users className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>دسترسی‌های {selectedRole.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        تیک زدن یا برداشتن تیک دسترسی‌ها
                      </p>
                    </div>
                    {selectedRole.is_protected && (
                      <Badge variant="destructive">نقش محافظت شده</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                    <div key={resource}>
                      <div className="flex items-center gap-2 mb-3">
                        {getResourceIcon(resource)}
                        <h3 className="font-semibold text-base">{resource}</h3>
                        <Badge variant="outline" className="text-xs">
                          {permissions.length} دسترسی
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission) => {
                          const hasPermission = roleHasPermission(selectedRole, permission.id);
                          const isModified = modifiedPermissions.has(permission.id);
                          
                          return (
                            <div
                              key={permission.id}
                              className={`p-3 rounded-lg border transition-all ${
                                isModified ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950' : 'border-border'
                              }`}
                            >
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={hasPermission}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                  disabled={selectedRole.is_protected && !hasPermission("admin.roles.manage")}
                                />
                                <label 
                                  htmlFor={`permission-${permission.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                      {permission.action}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${getActionColor(permission.action)}`}
                                    >
                                      {permission.action}
                                    </Badge>
                                  </div>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {permission.description}
                                    </p>
                                  )}
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    نقشی انتخاب نشده
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    برای مشاهده و ویرایش دسترسی‌ها، یک نقش انتخاب کنید.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Save Changes Dialog */}
        <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ذخیره تغییرات</AlertDialogTitle>
              <AlertDialogDescription>
                آیا مطمئن هستید که می‌خواهید {modifiedPermissions.size} تغییر اعمال شده را ذخیره کنید؟
                <br />
                این عمل دسترسی‌های نقش {selectedRole?.name} را تغییر می‌دهد.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveChanges}>
                ذخیره تغییرات
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGate>
  );
} 