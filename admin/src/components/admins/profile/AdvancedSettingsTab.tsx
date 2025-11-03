"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { AdminWithProfile } from "@/types/auth/admin";
import { Checkbox } from "@/components/elements/Checkbox";
import { Edit2, Loader2, AlertTriangle, Users, Shield, Check } from "lucide-react";
import { toast } from "sonner";
import { roleApi } from "@/api/roles/route";
import { adminApi } from "@/api/admins/route";
import { useAuth } from "@/core/auth/AuthContext";
import { hasPermission } from "@/core/auth/permissionUtils";
import { Role } from "@/types/auth/permission";
import { Badge } from "@/components/elements/Badge";
import { getPermissionTranslation } from "@/core/messages/permissions";

interface AdvancedSettingsTabProps {
    admin: AdminWithProfile;
}

interface RoleAssignment {
    roleId: number;
    assigned: boolean;
}

interface BasePermission {
    id: string;
    resource: string;
    action: string;
    display_name: string;
    description: string;
    is_base: boolean;
}

export function AdvancedSettingsTab({ admin }: AdvancedSettingsTabProps) {
    const { user } = useAuth();
    const [adminRoles, setAdminRoles] = useState<Role[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
    const [basePermissions, setBasePermissions] = useState<BasePermission[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adminStatusData, setAdminStatusData] = useState({
        is_active: admin.is_active,
        is_superuser: admin.is_superuser
    });

    // Check if current user can manage permissions
    const canManagePermissions = user && (
        user.is_superuser ||
        hasPermission({
            permissions: user.permissions || [],
            is_super: user.is_superuser,
            is_superuser: user.is_superuser
        }, 'role.manage') ||
        hasPermission({
            permissions: user.permissions || [],
            is_super: user.is_superuser,
            is_superuser: user.is_superuser
        }, 'admin.manage')
    );

    // Load admin roles and permissions
    useEffect(() => {
        loadAdminData();
    }, [admin.id]);

    const loadAdminData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load available roles
            const rolesResponse = await roleApi.getRoleList({ is_active: true });
            let rolesData: Role[] = [];
            
            if (rolesResponse.data && Array.isArray(rolesResponse.data)) {
                rolesData = rolesResponse.data;
            } else if (rolesResponse.data && typeof rolesResponse.data === 'object' && 'results' in rolesResponse.data && Array.isArray((rolesResponse.data as any).results)) {
                rolesData = (rolesResponse.data as any).results;
            } else if (rolesResponse && Array.isArray(rolesResponse)) {
                rolesData = rolesResponse;
            }
            
            setAvailableRoles(rolesData);

            // Load admin roles
            const adminRolesResponse = await adminApi.getAdminRoles(admin.id);
            
            // ✅ FIX: Extract role details from AdminUserRole structure
            const adminRolesData = Array.isArray(adminRolesResponse) 
                ? adminRolesResponse.map((assignment: any) => {
                    // AdminUserRole has nested 'role' object
                    if (assignment.role && typeof assignment.role === 'object') {
                        return assignment.role; // Return the nested role object
                    }
                    // Fallback: if it's already a role object
                    return assignment;
                  })
                : [];
            
            setAdminRoles(adminRolesData);

            // Initialize role assignments
            const initialAssignments: RoleAssignment[] = rolesData.map((role: Role) => {
                // ✅ FIX: Check against extracted role IDs
                const assigned = adminRolesData.some((adminRole: any) => {
                    return adminRole.id === role.id;
                });
                
                return {
                    roleId: role.id,
                    assigned: assigned
                };
            });
            
            setRoleAssignments(initialAssignments);

            // Load base permissions that all admins have
            try {
                const basePermsResponse = await roleApi.getBasePermissions();
                if (basePermsResponse.data && Array.isArray(basePermsResponse.data)) {
                    setBasePermissions(basePermsResponse.data);
                }
            } catch (permError) {
                console.error('Error loading base permissions:', permError);
            }
            
        } catch (error) {
            setError(getPermissionTranslation('خطا در بارگذاری اطلاعات دسترسی‌ها', 'description'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleAssignmentChange = (roleId: number, assigned: boolean) => {
        if (!editMode || !canManagePermissions) return;
        
        setRoleAssignments(prev => 
            prev.map(assignment => 
                assignment.roleId === roleId 
                    ? { ...assignment, assigned } 
                    : assignment
            )
        );
    };

    const handleStatusChange = async (field: 'is_active' | 'is_superuser', value: boolean) => {
        if (!canManagePermissions) {
            toast.error(getPermissionTranslation('شما دسترسی تغییر وضعیت این ادمین را ندارید', 'description'));
            return;
        }

        try {
            await adminApi.updateUserStatusByType(admin.id, value, 'admin');
            setAdminStatusData(prev => ({ ...prev, [field]: value }));
            toast.success(getPermissionTranslation('وضعیت ادمین با موفقیت به‌روزرسانی شد', 'description'));
        } catch (error) {
            toast.error(getPermissionTranslation('خطا در به‌روزرسانی وضعیت ادمین', 'description'));
        }
    };

    const handleCancel = () => {
        // ✅ FIX: Reset role assignments to original state
        const originalAssignments = availableRoles.map((role: Role) => ({
            roleId: role.id,
            // adminRoles now contains extracted role objects
            assigned: adminRoles.some((adminRole: any) => adminRole.id === role.id)
        }));
        setRoleAssignments(originalAssignments);
        setEditMode(false);
    };

    const handleSave = async () => {
        if (!canManagePermissions) {
            toast.error(getPermissionTranslation('شما دسترسی ویرایش دسترسی‌ها را ندارید', 'description'));
            return;
        }

        // Prevent editing permissions for Super Admin
        if (admin.is_superuser) {
            toast.info(getPermissionTranslation('سوپر ادمین به صورت خودکار تمام دسترسی‌ها را دارد', 'description'));
            setEditMode(false);
            return;
        }

        try {
            setIsSaving(true);
            
            // ✅ FIX: Handle role assignments
            // Get current assignments - adminRoles now contains extracted role objects
            const currentAssignedRoleIds = adminRoles.map((role: any) => role.id);
            
            const newAssignedRoleIds = roleAssignments
                .filter(assignment => assignment.assigned)
                .map(assignment => assignment.roleId);
            
            // Find roles to remove (currently assigned but not selected)
            const rolesToRemove = currentAssignedRoleIds.filter(
                (roleId: number) => !newAssignedRoleIds.includes(roleId)
            );
            
            // Find roles to add (selected but not currently assigned)
            const rolesToAdd = newAssignedRoleIds.filter(
                (roleId: number) => !currentAssignedRoleIds.includes(roleId)
            );
            
            // Remove roles
            for (const roleId of rolesToRemove) {
                try {
                    await adminApi.removeRoleFromAdmin(admin.id, roleId);
                } catch (error) {
                    // Error silently ignored - user will see if roles weren't removed
                }
            }
            
            // Add roles with detailed error tracking
            const assignResults: { success: number[], failed: { id: number, error: string }[] } = {
                success: [],
                failed: []
            };
            
            for (const roleId of rolesToAdd) {
                try {
                    await adminApi.assignRoleToAdmin(admin.id, roleId);
                    assignResults.success.push(roleId);
                } catch (error: any) {
                    // Get role name for better error message
                    const failedRole = availableRoles.find(r => r.id === roleId);
                    const roleName = failedRole?.display_name || `Role ${roleId}`;
                    
                    // Extract error message from API response
                    let errorMessage = 'خطای نامشخص';
                    if (error?.response?.data?.data?.validation_errors) {
                        errorMessage = JSON.stringify(error.response.data.data.validation_errors);
                    } else if (error?.response?.data?.metaData?.message) {
                        errorMessage = error.response.data.metaData.message;
                    } else if (error?.message) {
                        errorMessage = error.message;
                    }
                    
                    assignResults.failed.push({ id: roleId, error: `${roleName}: ${errorMessage}` });
                }
            }
            
            // Show appropriate toast message based on results
            if (assignResults.failed.length === 0) {
                // All successful
                toast.success(getPermissionTranslation("نقش‌های ادمین با موفقیت به‌روزرسانی شد", 'description'));
            } else if (assignResults.success.length === 0) {
                // All failed
                toast.error(
                    getPermissionTranslation('خطا در تخصیص تمام نقش‌ها', 'description'),
                    {
                        description: assignResults.failed.map(f => f.error).join('\n')
                    }
                );
            } else {
                // Partial success
                toast.warning(
                    getPermissionTranslation('بعضی نقش‌ها با خطا مواجه شدند', 'description'),
                    {
                        description: `✅ موفق: ${assignResults.success.length}\n❌ ناموفق: ${assignResults.failed.length}`
                    }
                );
            }
            
            setEditMode(false);
            
            // Reload data to reflect changes (even if some failed)
            await loadAdminData();
            
        } catch (error) {
            toast.error(getPermissionTranslation('خطا در ذخیره تغییرات', 'description'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <TabsContent value="advanced_settings">
            <div className="space-y-6">
            {/* Admin Settings Card */}
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-purple-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 rounded-xl shadow-sm">
                            <Shield className="w-5 h-5 stroke-purple-600" />
                        </div>
                        تنظیمات پیشرفته
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="account-status">{getPermissionTranslation('وضعیت حساب', 'resource')}</Label>
                                <p className="text-sm text-muted-foreground">
                                    {getPermissionTranslation('حساب کاربری این ادمین را فعال یا غیرفعال کنید.', 'description')}
                                </p>
                            </div>
                            <Switch
                                id="account-status"
                                checked={adminStatusData.is_active}
                                onCheckedChange={(checked) => handleStatusChange('is_active', checked)}
                                disabled={!canManagePermissions}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="super-admin-access">{getPermissionTranslation('دسترسی سوپر ادمین', 'resource')}</Label>
                                <p className="text-sm text-muted-foreground">
                                    {getPermissionTranslation('این کاربر به تمام بخش‌های سیستم دسترسی خواهد داشت.', 'description')}
                                </p>
                            </div>
                            <Switch
                                id="super-admin-access"
                                checked={adminStatusData.is_superuser}
                                onCheckedChange={(checked) => handleStatusChange('is_superuser', checked)}
                                disabled={!canManagePermissions || !user?.is_superuser}
                            />
                        </div>

                        {/* Admin Roles Display */}
                        {adminRoles.length > 0 && (
                            <div className="rounded-lg border p-4">
                                <Label>{getPermissionTranslation('نقش‌های فعلی', 'resource')}</Label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {adminRoles.map((role) => (
                                        <span
                                            key={role.id}
                                            className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary ring-1 ring-inset ring-primary/20"
                                        >
                                            {getPermissionTranslation(role.name, 'role')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Base Permissions Display - دسترسی‌های پایه */}
                        {basePermissions.length > 0 && (
                            <div className="rounded-lg border p-4 bg-green-50/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-green-600" />
                                    <Label className="text-green-700">دسترسی‌های پایه</Label>
                                </div>
                                <p className="text-muted-foreground mb-3">
                                    این دسترسی‌ها به صورت خودکار برای همه ادمین‌ها فعال است:
                                </p>
                                <div className="space-y-2">
                                    {basePermissions.map((perm) => (
                                        <div key={perm.id} className="flex items-start gap-2 p-2 rounded-md bg-card border border-green-100">
                                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="text-foreground">{perm.display_name}</div>
                                                {perm.description && (
                                                    <div className="text-muted-foreground">{perm.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                </CardContent>
            </Card>

            {/* Role Assignment Card - Simplified role assignment without detailed permissions */}
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                            <Users className="w-5 h-5 stroke-indigo-600" />
                        </div>
                        اختصاص نقش‌ها
                    </CardTitle>
                    <div className="flex gap-2">
                        {canManagePermissions ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => editMode ? handleCancel() : setEditMode(true)}
                                    disabled={isLoading || isSaving}
                                >
                                    <Edit2 className="w-4 h-4 me-2" />
                                    {editMode ? getPermissionTranslation("لغو", 'action') : getPermissionTranslation("ویرایش نقش‌ها", 'resource')}
                                </Button>
                                {editMode && !admin.is_superuser && (
                                    <Button 
                                        size="sm" 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                                        {getPermissionTranslation("ذخیره", 'action')}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertTriangle className="w-4 h-4" />
                                {getPermissionTranslation('فقط مشاهده (عدم دسترسی ویرایش)', 'description')}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Super Admin Info */}
                    {admin.is_superuser && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                <h4 className="text-green-700">{getPermissionTranslation('سوپر ادمین - دسترسی کامل', 'description')}</h4>
                            </div>
                            <p className="text-green-600 mt-1">
                                {getPermissionTranslation('این کاربر به عنوان سوپر ادمین به صورت خودکار تمام ماژول‌ها و عملیات را در اختیار دارد.', 'description')}
                            </p>
                        </div>
                    )}
                    
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-8 text-destructive">
                            <AlertTriangle className="w-5 h-5 me-2" />
                            {error}
                        </div>
                    ) : availableRoles && availableRoles.length > 0 ? (
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <div className="p-4 space-y-3">
                                    {availableRoles.map((role) => (
                                        <div key={role.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={roleAssignments.find(a => a.roleId === role.id)?.assigned}
                                                    onCheckedChange={(checked) => handleRoleAssignmentChange(role.id, !!checked)}
                                                    disabled={!editMode || !canManagePermissions || admin.is_superuser}
                                                />
                                                <Label htmlFor={`role-${role.id}`}>
                                                    {getPermissionTranslation(role.name, 'role')}
                                                </Label>
                                                {role.is_system_role && (
                                                    <Badge variant="outline">
                                                        {getPermissionTranslation('سیستمی', 'description')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {getPermissionTranslation(role.name, 'roleDescription') || role.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {editMode && !admin.is_superuser && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        {getPermissionTranslation('نقش‌های انتخاب شده:', 'resource')} {
                                            roleAssignments.filter(a => a.assigned).length
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            {getPermissionTranslation('نقشی موجود نیست', 'description')}
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        </TabsContent>
    );
}