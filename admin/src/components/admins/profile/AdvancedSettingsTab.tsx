"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { AdminWithProfile } from "@/types/auth/admin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/elements/Table";
import { Checkbox } from "@/components/elements/Checkbox";
import { Edit2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { roleApi } from "@/api/roles/route";
import { adminApi } from "@/api/admins/route";
import { useAuth } from "@/core/auth/AuthContext";
import { hasPermission } from "@/core/auth/permissionUtils";
import { Role, PermissionGroup } from "@/types/auth/permission";

interface AdvancedSettingsTabProps {
    admin: AdminWithProfile;
}

const MODULE_NAME_MAP: Record<string, string> = {
    'admin': 'مدیریت ادمین‌ها',
    'user': 'مدیریت کاربران',
    'role': 'مدیریت نقش‌ها', 
    'permission': 'مدیریت دسترسی‌ها',
    'portfolio': 'مدیریت نمونه کارها',
    'blog': 'مدیریت بلاگ',
    'media': 'مدیریت رسانه',
    'settings': 'تنظیمات سیستم',
    'statistics': 'آمار و گزارشات',
    'audit_log': 'گزارش فعالیت‌ها'
};

const ACTION_NAME_MAP: Record<string, string> = {
    'view': 'مشاهده',
    'list': 'مشاهده لیست', 
    'create': 'ایجاد',
    'edit': 'ویرایش',
    'update': 'ویرایش',
    'delete': 'حذف',
    'manage': 'مدیریت کامل',
    'export': 'خروجی',
    'import': 'ورودی',
    'approve': 'تایید',
    'publish': 'انتشار'
};

interface ModulePermission {
    id: string;
    module: string;
    permissions: Record<string, boolean>;
}

interface RolePermissionData {
    modules: string[];
    actions: string[];
}

type PermissionKey = 'view' | 'modify' | 'publish' | 'configure';

export function AdvancedSettingsTab({ admin }: AdvancedSettingsTabProps) {
    const { user } = useAuth();
    const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
    const [adminRoles, setAdminRoles] = useState<Role[]>([]);
    const [availableActions, setAvailableActions] = useState<string[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [originalPermissions, setOriginalPermissions] = useState<ModulePermission[]>([]);
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

            // Load available permissions
            const permissionsResponse = await roleApi.getPermissions();
            const permissionGroups = permissionsResponse.data;

            // Extract unique actions
            const actions = new Set<string>();
            permissionGroups.forEach(group => {
                group.permissions.forEach(permission => {
                    actions.add(permission.action.toLowerCase());
                });
            });
            setAvailableActions(Array.from(actions));

            // Load admin roles
            const rolesResponse = await adminApi.getAdminRoles(admin.id);
            setAdminRoles(rolesResponse);

            // Convert role permissions to module permissions structure
            const modulePermsMap = new Map<string, Record<string, boolean>>();
            
            // Initialize all modules with false permissions
            Object.keys(MODULE_NAME_MAP).forEach(module => {
                modulePermsMap.set(module, {});
                Array.from(actions).forEach(action => {
                    modulePermsMap.get(module)![action] = false;
                });
            });

            // Special handling for Super Admin - they have ALL permissions
            if (admin.is_superuser) {
                // Super admin gets all permissions enabled
                Object.keys(MODULE_NAME_MAP).forEach(module => {
                    Array.from(actions).forEach(action => {
                        modulePermsMap.get(module)![action] = true;
                    });
                });
            } else {
                // Apply permissions from roles for regular admins
                rolesResponse.forEach((role: Role) => {
                    if (role.permissions) {
                        const rolePermissions = role.permissions as RolePermissionData;
                        const modules = rolePermissions.modules || [];
                        const roleActions = rolePermissions.actions || [];

                        // Handle 'all' modules case
                        if (modules.includes('all')) {
                            // Grant all actions to all modules
                            Object.keys(MODULE_NAME_MAP).forEach(module => {
                                roleActions.forEach(action => {
                                    modulePermsMap.get(module)![action] = true;
                                });
                            });
                        } else {
                            // Grant specific module permissions
                            modules.forEach(module => {
                                if (modulePermsMap.has(module)) {
                                    // Handle 'all' actions case
                                    if (roleActions.includes('all')) {
                                        Array.from(actions).forEach(action => {
                                            modulePermsMap.get(module)![action] = true;
                                        });
                                    } else {
                                        roleActions.forEach(action => {
                                            modulePermsMap.get(module)![action] = true;
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            }

            // Convert to array format
            const modulePermissionsArray: ModulePermission[] = [];
            modulePermsMap.forEach((permissions, moduleId) => {
                modulePermissionsArray.push({
                    id: moduleId,
                    module: MODULE_NAME_MAP[moduleId] || moduleId,
                    permissions
                });
            });

            setModulePermissions(modulePermissionsArray);
            setOriginalPermissions(JSON.parse(JSON.stringify(modulePermissionsArray)));
            
        } catch (error) {
            console.error('Error loading admin data:', error);
            setError('خطا در بارگذاری اطلاعات دسترسی‌ها');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePermissionChange = (moduleId: string, action: string) => {
        if (!editMode || !canManagePermissions) return;
        
        // Prevent editing permissions for Super Admin
        if (admin.is_superuser) {
            toast.info('سوپر ادمین به صورت خودکار تمام دسترسی‌ها را دارد');
            return;
        }
        
        setModulePermissions(prev =>
            prev.map(p =>
                p.id === moduleId 
                    ? { 
                        ...p, 
                        permissions: {
                            ...p.permissions,
                            [action]: !p.permissions[action]
                        }
                    } 
                    : p
            )
        );
    };

    const handleStatusChange = async (field: 'is_active' | 'is_superuser', value: boolean) => {
        if (!canManagePermissions) {
            toast.error('شما دسترسی تغییر وضعیت این ادمین را ندارید');
            return;
        }

        try {
            await adminApi.updateUserStatusByType(admin.id, value, 'admin');
            setAdminStatusData(prev => ({ ...prev, [field]: value }));
            toast.success('وضعیت ادمین با موفقیت به‌روزرسانی شد');
        } catch (error) {
            console.error('Error updating admin status:', error);
            toast.error('خطا در به‌روزرسانی وضعیت ادمین');
        }
    };

    const handleCancel = () => {
        setModulePermissions(JSON.parse(JSON.stringify(originalPermissions)));
        setEditMode(false);
    };

    const handleSave = async () => {
        if (!canManagePermissions) {
            toast.error('شما دسترسی ویرایش دسترسی‌ها را ندارید');
            return;
        }

        // Prevent editing permissions for Super Admin
        if (admin.is_superuser) {
            toast.info('سوپر ادمین به صورت خودکار تمام دسترسی‌ها را دارد');
            setEditMode(false);
            return;
        }

        try {
            setIsSaving(true);
            
            // Convert module permissions back to role format
            const allModules = new Set<string>();
            const allActions = new Set<string>();
            
            modulePermissions.forEach(module => {
                Object.entries(module.permissions).forEach(([action, hasAccess]) => {
                    if (hasAccess) {
                        allModules.add(module.id);
                        allActions.add(action);
                    }
                });
            });

            // Create/Update admin role with new permissions
            const roleData = {
                name: `نقش سفارشی ${admin.full_name}`,
                description: `نقش سفارشی برای ادمین ${admin.full_name}`,
                permissions: {
                    modules: Array.from(allModules),
                    actions: Array.from(allActions)
                }
            };

            // Check if admin has existing custom role
            const existingCustomRole = adminRoles.find(role => 
                role.name.includes('نقش سفارشی') || 
                role.name.includes(admin.full_name)
            );

            if (existingCustomRole) {
                await roleApi.updateRole(existingCustomRole.id, roleData);
            } else {
                const newRole = await roleApi.createRole(roleData);
                await adminApi.assignRoleToAdmin(admin.id, newRole.data.id);
            }

            setOriginalPermissions(JSON.parse(JSON.stringify(modulePermissions)));
            setEditMode(false);
            toast.success("دسترسی‌های ادمین با موفقیت ذخیره شد");
            
            // Reload data to reflect changes
            await loadAdminData();
            
        } catch (error) {
            console.error('Error saving permissions:', error);
            toast.error("خطا در ذخیره دسترسی‌ها");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <TabsContent value="advanced_settings" className="mt-6 space-y-6">
            {/* Admin Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle>تنظیمات مدیریتی</CardTitle>
                    <CardDescription>
                        این تنظیمات حساس فقط توسط سوپر ادمین قابل تغییر است.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="account-status" className="text-base">وضعیت حساب</Label>
                            <p className="text-sm text-muted-foreground">
                                حساب کاربری این ادمین را فعال یا غیرفعال کنید.
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
                            <Label htmlFor="super-admin-access" className="text-base">دسترسی سوپر ادمین</Label>
                            <p className="text-sm text-muted-foreground">
                                این کاربر به تمام بخش‌های سیستم دسترسی خواهد داشت.
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
                            <Label className="text-base">نقش‌های فعلی</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {adminRoles.map((role) => (
                                    <span
                                        key={role.id}
                                        className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                                    >
                                        {role.display_name || role.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Roles Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>دسترسی‌های نقش</CardTitle>
                        <CardDescription>
                            سطوح دسترسی برای ماژول‌های مختلف سیستم را مدیریت کنید.
                        </CardDescription>
                    </div>
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
                                    {editMode ? "لغو" : (admin.is_superuser ? "مشاهده دسترسی‌ها" : "ویرایش دسترسی‌ها")}
                                </Button>
                                {editMode && !admin.is_superuser && (
                                    <Button 
                                        size="sm" 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                                        ذخیره
                                    </Button>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <AlertTriangle className="w-4 h-4" />
                                فقط مشاهده (عدم دسترسی ویرایش)
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Super Admin Info */}
                    {admin.is_superuser && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <h4 className="font-semibold text-sm text-green-700">سوپر ادمین - دسترسی کامل</h4>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                                این کاربر به عنوان سوپر ادمین به صورت خودکار تمام ماژول‌ها و عملیات را در اختیار دارد.
                            </p>
                        </div>
                    )}
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin me-2" />
                            در حال بارگذاری دسترسی‌ها...
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-8 text-red-600">
                            <AlertTriangle className="w-5 h-5 me-2" />
                            {error}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px] text-right">ماژول</TableHead>
                                    {availableActions.map((action) => (
                                        <TableHead key={action} className="text-center">
                                            {ACTION_NAME_MAP[action] || action}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {modulePermissions.map((moduleData) => (
                                    <TableRow key={moduleData.id}>
                                        <TableCell className="font-medium text-right">
                                            {moduleData.module}
                                        </TableCell>
                                        {availableActions.map((action) => (
                                            <TableCell key={`${moduleData.id}-${action}`} className="text-center">
                                                <Checkbox
                                                    checked={moduleData.permissions[action] || false}
                                                    onCheckedChange={() => handlePermissionChange(moduleData.id, action)}
                                                    disabled={!editMode || !canManagePermissions || admin.is_superuser}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    );
}
