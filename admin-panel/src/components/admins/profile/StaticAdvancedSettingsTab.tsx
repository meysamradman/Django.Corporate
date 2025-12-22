import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import type { AdminWithProfile } from "@/types/auth/admin";
import { Checkbox } from "@/components/elements/Checkbox";
import { Edit2, Loader2, Shield, Check } from "lucide-react";
import type { Role } from "@/types/auth/permission";
import { Badge } from "@/components/elements/Badge";

interface StaticAdvancedSettingsTabProps {
    admin: AdminWithProfile;
}

import type { RoleAssignment } from '@/types/auth/permission';

interface BasePermission {
    id: string;
    resource: string;
    action: string;
    display_name: string;
    description: string;
    is_base: boolean;
}

export function StaticAdvancedSettingsTab({ admin }: StaticAdvancedSettingsTabProps) {
    const [editMode, setEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const availableRoles: Role[] = [
        {
            id: 1,
            public_id: "admin-role-1",
            name: "ادمین کل",
            display_name: "ادمین کل",
            description: "دسترسی کامل به تمام بخش‌ها",
            is_active: true,
            is_system_role: true,
            level: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            permissions: { modules: ["all"], actions: ["all"], special: [], restrictions: [] }
        },
        {
            id: 2,
            public_id: "editor-role-2",
            name: "ویرایشگر محتوا",
            display_name: "ویرایشگر محتوا",
            description: "دسترسی ویرایش محتوا",
            is_active: true,
            is_system_role: false,
            level: 50,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            permissions: { modules: ["portfolio", "blog"], actions: ["view", "create", "update"], special: [], restrictions: [] }
        },
        {
            id: 3,
            public_id: "viewer-role-3",
            name: "مشاهده‌گر",
            display_name: "مشاهده‌گر",
            description: "دسترسی فقط مشاهده",
            is_active: true,
            is_system_role: false,
            level: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            permissions: { modules: ["portfolio"], actions: ["view"], special: [], restrictions: [] }
        },
    ];

    const adminRoles: Role[] = admin.roles && admin.roles.length > 0 ? admin.roles : [];

    const basePermissions: BasePermission[] = [
        { id: "1", resource: "dashboard", action: "view", display_name: "مشاهده داشبورد", description: "دسترسی به صفحه اصلی", is_base: true },
        { id: "2", resource: "profile", action: "view", display_name: "مشاهده پروفایل", description: "مشاهده پروفایل شخصی", is_base: true },
        { id: "3", resource: "profile", action: "update", display_name: "ویرایش پروفایل", description: "ویرایش پروفایل شخصی", is_base: true },
        { id: "4", resource: "media", action: "view", display_name: "مشاهده مدیا", description: "مشاهده کتابخانه رسانه", is_base: true },
    ];

    const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>(() =>
        availableRoles.map((role) => ({
            roleId: role.id,
            assigned: adminRoles.some((adminRole) => adminRole.id === role.id)
        }))
    );

    const handleRoleAssignmentChange = (roleId: number, assigned: boolean) => {
        if (!editMode) return;
        
        setRoleAssignments(prev => 
            prev.map(assignment => 
                assignment.roleId === roleId 
                    ? { ...assignment, assigned } 
                    : assignment
            )
        );
    };

    const handleCancel = () => {
        const originalAssignments = availableRoles.map((role) => ({
            roleId: role.id,
            assigned: adminRoles.some((adminRole) => adminRole.id === role.id)
        }));
        setRoleAssignments(originalAssignments);
        setEditMode(false);
    };

    const handleSave = () => {
        setIsSaving(true);
        
        setTimeout(() => {
            setEditMode(false);
            setIsSaving(false);
        }, 1000);
    };

    return (
        <TabsContent value="advanced_settings">
            <h1 className="page-title">
                پروفایل ادمین (استاتیک)
            </h1>

            <Card>
                <CardHeader>
                    <CardTitle>تنظیمات پیشرفته</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="account-status" className="text-base">وضعیت حساب</Label>
                            <p className="text-sm text-font-s">
                                حساب کاربری این ادمین را فعال یا غیرفعال کنید.
                            </p>
                        </div>
                        <Switch
                            id="account-status"
                            checked={admin.is_active}
                            disabled
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="super-admin-access" className="text-base">دسترسی سوپر ادمین</Label>
                            <p className="text-sm text-font-s">
                                این کاربر به تمام بخش‌های سیستم دسترسی خواهد داشت.
                            </p>
                        </div>
                        <Switch
                            id="super-admin-access"
                            checked={admin.is_superuser}
                            disabled
                        />
                    </div>

                    {adminRoles.length > 0 && (
                        <div className="rounded-lg border p-4">
                            <Label className="text-base">نقش‌های فعلی</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {adminRoles.map((role) => (
                                    <span
                                        key={role.id}
                                        className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
                                    >
                                        {role.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {basePermissions.length > 0 && (
                        <div className="rounded-lg border p-4 bg-green/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-green-1" />
                                <Label className="text-base text-green-2">دسترسی‌های پایه</Label>
                            </div>
                            <p className="text-sm text-font-s mb-3">
                                این دسترسی‌ها به صورت خودکار برای همه ادمین‌ها فعال است:
                            </p>
                            <div className="space-y-2">
                                {basePermissions.map((perm) => (
                                    <div key={perm.id} className="flex items-start gap-2 p-2 rounded-md bg-card border border-green-1">
                                        <Check className="w-4 h-4 text-green-1 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-foreground">{perm.display_name}</div>
                                            {perm.description && (
                                                <div className="text-xs text-font-s">{perm.description}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>اختصاص نقش‌ها</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => editMode ? handleCancel() : setEditMode(true)}
                            disabled={isSaving}
                        >
                            <Edit2 className="w-4 h-4" />
                            {editMode ? "لغو" : "ویرایش نقش‌ها"}
                        </Button>
                        {editMode && !admin.is_superuser && (
                            <Button 
                                size="sm" 
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                ذخیره
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {admin.is_superuser && (
                        <div className="mb-4 p-4 bg-green border border-green-1 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-1"></div>
                                <h4 className="font-semibold text-sm text-green-2">سوپر ادمین - دسترسی کامل</h4>
                            </div>
                            <p className="text-xs text-green-1 mt-1">
                                این کاربر به عنوان سوپر ادمین به صورت خودکار تمام ماژول‌ها و عملیات را در اختیار دارد.
                            </p>
                        </div>
                    )}
                    
                    {availableRoles && availableRoles.length > 0 ? (
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <div className="p-4 space-y-3">
                                    {availableRoles.map((role) => (
                                        <div key={role.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-bg/50">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={roleAssignments.find(a => a.roleId === role.id)?.assigned}
                                                    onCheckedChange={(checked) => handleRoleAssignmentChange(role.id, !!checked)}
                                                    disabled={!editMode || admin.is_superuser}
                                                />
                                                <Label htmlFor={`role-${role.id}`} className="font-medium">
                                                    {role.name}
                                                </Label>
                                                {role.is_system_role && (
                                                    <Badge variant="outline" className="text-xs">
                                                        سیستمی
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-font-s">
                                                {role.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {editMode && !admin.is_superuser && (
                                <div className="mt-4 p-3 bg-bg/50 rounded-lg">
                                    <div className="text-sm font-medium">
                                        نقش‌های انتخاب شده: {roleAssignments.filter(a => a.assigned).length}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-font-s py-8">
                            نقشی موجود نیست
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    );
}
