import { useState, useEffect, useCallback } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Label } from "@/components/elements/Label";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import type { AdminWithProfile } from "@/types/auth/admin";
import { Checkbox } from "@/components/elements/Checkbox";
import { Edit2, Loader2, AlertTriangle, Users } from "lucide-react";
import { showSuccess, showError, showInfo, showWarning } from "@/core/toast";
import { roleApi } from "@/api/admins/roles/roles";
import { adminApi } from "@/api/admins/admins";
import { useAuth } from "@/core/auth/AuthContext";
import { hasPermission } from "@/components/admins/permissions/utils/permissionUtils";
import type { Role } from "@/types/auth/permission";
import { Badge } from "@/components/elements/Badge";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { useQueryClient } from "@tanstack/react-query";

interface AdvancedSettingsTabProps {
    admin: AdminWithProfile;
}

import type { RoleAssignment } from '@/types/auth/permission';

export function AdvancedSettingsTab({ admin }: AdvancedSettingsTabProps) {
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [adminRoles, setAdminRoles] = useState<Role[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const userPermissionsObj = {
        permissions: user?.permissions || [],
        is_super: user?.is_superuser || false,
        is_superuser: user?.is_superuser || false
    };
    
    const canManagePermissions = user && (
        user.is_superuser ||
        hasPermission(userPermissionsObj, 'role.manage') ||
        hasPermission(userPermissionsObj, 'admin.manage')
    );

    const loadAdminData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const rolesData = await roleApi.getAllRoles();
            setAvailableRoles(rolesData);

            const adminRolesResponse = await adminApi.getAdminRoles(admin.id);
            
            const adminRolesData = Array.isArray(adminRolesResponse) 
                ? adminRolesResponse.map((assignment: any) => {
                    if (assignment.role && typeof assignment.role === 'object' && assignment.role.id) {
                        return {
                            id: assignment.role.id,
                            name: assignment.role.name,
                            display_name: assignment.role.display_name || assignment.role.name,
                            description: assignment.role.description,
                            level: assignment.role.level,
                            is_system_role: assignment.role.is_system_role,
                            permissions: assignment.role.permissions,
                            is_active: assignment.role.is_active
                        };
                    }
                    if (assignment.id && assignment.name) {
                        return assignment;
                    }
                    return null;
                  }).filter((role: any) => role !== null)
                : [];
            
            setAdminRoles(adminRolesData);

            const initialAssignments: RoleAssignment[] = rolesData.map((role: Role) => {
                const assigned = adminRolesData.some((adminRole: any) => {
                    return adminRole && adminRole.id === role.id;
                });
                
                return {
                    roleId: role.id,
                    assigned: assigned
                };
            });
            
            setRoleAssignments(initialAssignments);
            
        } catch {
            setError(getPermissionTranslation('خطا در بارگذاری اطلاعات دسترسی‌ها', 'description'));
        } finally {
            setIsLoading(false);
        }
    }, [admin.id]);
    
    useEffect(() => {
        setEditMode(false);
        loadAdminData();
    }, [admin.id, loadAdminData]);
    
    useEffect(() => {
        if (!editMode) {
            loadAdminData();
        }
    }, [admin, editMode, loadAdminData]);

    const handleRoleAssignmentChange = (roleId: number, assigned: boolean) => {
        if (!editMode || !canManagePermissions) return;
        
        setRoleAssignments(prev => {
            const existingAssignment = prev.find(a => a.roleId === roleId);
            
            if (existingAssignment) {
                return prev.map(assignment => 
                    assignment.roleId === roleId 
                        ? { roleId, assigned }
                        : assignment
                );
            } else {
                return [...prev, { roleId, assigned }];
            }
        });
    };


    const handleCancel = () => {
        const originalAssignments = availableRoles.map((role: Role) => ({
            roleId: role.id,
            assigned: adminRoles.some((adminRole: any) => adminRole.id === role.id)
        }));
        setRoleAssignments(originalAssignments);
        setEditMode(false);
    };

    const handleSave = async () => {
        if (!canManagePermissions) {
            showError(getPermissionTranslation('شما دسترسی ویرایش دسترسی‌ها را ندارید', 'description'));
            return;
        }

        if (admin.is_superuser) {
            showInfo(getPermissionTranslation('سوپر ادمین به صورت خودکار تمام دسترسی‌ها را دارد', 'description'));
            setEditMode(false);
            return;
        }

        try {
            setIsSaving(true);
            
            const currentAssignedRoleIds = adminRoles.map((role: any) => role.id);
            
            const newAssignedRoleIds = roleAssignments
                .filter(assignment => assignment.assigned === true)
                .map(assignment => assignment.roleId);
            
            const rolesToRemove = currentAssignedRoleIds.filter(
                (roleId: number) => !newAssignedRoleIds.includes(roleId)
            );
            
            const rolesToAdd = newAssignedRoleIds.filter(
                (roleId: number) =>                 !currentAssignedRoleIds.includes(roleId)
            );
            
            const removeResults: { success: number[], failed: { id: number, error: string }[] } = {
                success: [],
                failed: []
            };
            
            for (const roleId of rolesToRemove) {
                try {
                    await adminApi.removeRoleFromAdmin(admin.id, roleId);
                    removeResults.success.push(roleId);
                } catch (error: any) {
                    const failedRole = availableRoles.find(r => r.id === roleId);
                    const roleName = failedRole?.display_name || `Role ${roleId}`;
                    
                    let errorMessage = 'خطای نامشخص';
                    if (error?.response?.data?.data?.validation_errors) {
                        errorMessage = JSON.stringify(error.response.data.data.validation_errors);
                    } else if (error?.response?.data?.metaData?.message) {
                        errorMessage = error.response.data.metaData.message;
                    } else if (error?.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    } else if (error?.message) {
                        errorMessage = error.message;
                    }
                    
                    removeResults.failed.push({ id: roleId, error: `${roleName}: ${errorMessage}` });
                }
            }
            
            const assignResults: { success: number[], failed: { id: number, error: string }[] } = {
                success: [],
                failed: []
            };
            
            for (const roleId of rolesToAdd) {
                try {
                    await adminApi.assignRoleToAdmin(admin.id, roleId);
                    assignResults.success.push(roleId);
                } catch (error: any) {
                    const failedRole = availableRoles.find(r => r.id === roleId);
                    const roleName = failedRole?.display_name || `Role ${roleId}`;
                    
                    let errorMessage = 'خطای نامشخص';
                    if (error?.response?.data?.data?.validation_errors) {
                        errorMessage = JSON.stringify(error.response.data.data.validation_errors);
                    } else if (error?.response?.data?.metaData?.message) {
                        errorMessage = error.response.data.metaData.message;
                    } else if (error?.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    } else if (error?.message) {
                        errorMessage = error.message;
                    }
                    
                    assignResults.failed.push({ id: roleId, error: `${roleName}: ${errorMessage}` });
                }
            }
            
            const totalFailed = removeResults.failed.length + assignResults.failed.length;
            const totalSuccess = removeResults.success.length + assignResults.success.length;
            
            if (totalFailed === 0 && totalSuccess > 0) {
                showSuccess(getPermissionTranslation("نقش‌های ادمین با موفقیت به‌روزرسانی شد", 'description'));
            } else if (totalSuccess === 0 && totalFailed > 0) {
                const allErrors = [...removeResults.failed, ...assignResults.failed].map(f => f.error);
                showError(
                    getPermissionTranslation('خطا در به‌روزرسانی نقش‌ها', 'description'),
                    {
                        description: allErrors.join('\n')
                    }
                );
            } else if (totalFailed > 0) {
                const allErrors = [...removeResults.failed, ...assignResults.failed].map(f => f.error);
                showWarning(
                    getPermissionTranslation('بعضی نقش‌ها با خطا مواجه شدند', 'description'),
                    {
                        description: [
                            `موفق: ${totalSuccess}`,
                            `ناموفق: ${totalFailed}`,
                            '',
                            ...allErrors
                        ].join('\n')
                    }
                );
            }
            
            if (totalSuccess > 0) {
                setEditMode(false);
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                setAdminRoles([]);
                setRoleAssignments([]);
                
                await loadAdminData();
                
                await queryClient.invalidateQueries({ queryKey: ['permission-map'] });
                
                if (refreshUser && (user?.id === admin.id || rolesToAdd.length > 0 || rolesToRemove.length > 0)) {
                    await refreshUser();
                }
            }
            
        } catch (error) {
            showError(error, { customMessage: getPermissionTranslation('خطا در ذخیره تغییرات', 'description') });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <TabsContent value="advanced_settings">
            <div className="space-y-6">
            <CardWithIcon
                icon={Users}
                title="اختصاص نقش‌ها"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
                titleExtra={
                    <div className="flex gap-2">
                        {canManagePermissions ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => editMode ? handleCancel() : setEditMode(true)}
                                    disabled={isLoading || isSaving}
                                >
                                    <Edit2 className="w-4 h-4" />
                                    {editMode ? getPermissionTranslation("لغو", 'action') : getPermissionTranslation("ویرایش نقش‌ها", 'resource')}
                                </Button>
                                {editMode && !admin.is_superuser && (
                                    <Button 
                                        size="sm" 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {getPermissionTranslation("ذخیره", 'action')}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-font-s">
                                <AlertTriangle className="w-4 h-4" />
                                {getPermissionTranslation('فقط مشاهده (عدم دسترسی ویرایش)', 'description')}
                            </div>
                        )}
                    </div>
                }
            >
                    {admin.is_superuser && (
                        <div className="mb-4 p-4 bg-green border border-green-1 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-1"></div>
                                <h4 className="text-green-2">{getPermissionTranslation('سوپر ادمین - دسترسی کامل', 'description')}</h4>
                            </div>
                            <p className="text-green-1 mt-1">
                                {getPermissionTranslation('این کاربر به عنوان سوپر ادمین به صورت خودکار تمام ماژول‌ها و عملیات را در اختیار دارد.', 'description')}
                            </p>
                        </div>
                    )}
                    
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-4 bg-bg animate-pulse rounded" />
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
                                        <div key={role.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-bg/50">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={roleAssignments.find(a => a.roleId === role.id)?.assigned ?? false}
                                                    onCheckedChange={(checked) => {
                                                        handleRoleAssignmentChange(role.id, checked === true);
                                                    }}
                                                    disabled={!editMode || !canManagePermissions || admin.is_superuser}
                                                />
                                                <Label htmlFor={`role-${role.id}`}>
                                                    {role.is_system_role
                                                        ? (getPermissionTranslation(role.name, 'role') || role.display_name || role.name)
                                                        : (role.display_name || role.name)
                                                    }
                                                </Label>
                                                {role.is_system_role && (
                                                    <Badge variant="outline">
                                                        سیستمی
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-font-s">
                                                {role.is_system_role
                                                    ? (getPermissionTranslation(role.name, 'roleDescription') || role.description)
                                                    : (role.description || '')
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {editMode && !admin.is_superuser && (
                                <div className="mt-4 p-3 bg-bg rounded-lg">
                                    <div>
                                        {getPermissionTranslation('نقش‌های انتخاب شده:', 'resource')} {
                                            roleAssignments.filter(a => a.assigned).length
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-font-s py-8">
                            {getPermissionTranslation('نقشی موجود نیست', 'description')}
                        </div>
                    )}
            </CardWithIcon>
            </div>
        </TabsContent>
    );
}