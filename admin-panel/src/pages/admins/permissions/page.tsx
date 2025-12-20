import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Checkbox } from "@/components/elements/Checkbox";
import { Separator } from "@/components/elements/Separator";
import { Search, Shield, Users, Settings, Eye, Save, Loader2 } from "lucide-react";
import { useRoles, usePermissions } from "@/components/admins/permissions/hooks/useRoles";
import { useUserPermissions } from "@/components/admins/permissions/hooks/useUserPermissions";
import { PermissionGate as PermissionGateLegacy } from "@/components/admins/permissions/components/PermissionGateLegacy";
import { Skeleton } from "@/components/elements/Skeleton";
import { showSuccess, showError } from '@/core/toast';
import type { PermissionGroup, Permission, RoleWithPermissions } from "@/types/auth/permission";
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

export default function PermissionsManagementPage() {
  const { hasPermission: checkUserPermission } = useUserPermissions();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [modifiedPermissions, setModifiedPermissions] = useState<Set<number>>(new Set());
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const roles = rolesData?.data || [];
  const permissionGroups = permissionsData || [];

  const filteredRoles = (roles as unknown as RoleWithPermissions[]).filter((role: RoleWithPermissions) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedPermissions = useMemo(() => {
    if (!Array.isArray(permissionGroups)) return {};
    
    const groups: Record<string, Permission[]> = {};
    
    permissionGroups.forEach((group: PermissionGroup) => {
      if (group.permissions && Array.isArray(group.permissions)) {
        const permissionsWithStandalone = group.permissions.map(perm => ({
          ...perm,
          is_standalone: perm.is_standalone || false
        }));
        groups[group.resource] = permissionsWithStandalone;
      }
    });

    return groups;
  }, [permissionGroups]);

  const roleHasPermission = (role: RoleWithPermissions, permissionId: number): boolean => {
    return role.permissions?.some(perm => perm.id === permissionId) || false;
  };

  const togglePermission = (permissionId: number) => {
    if (!selectedRole) return;

    const newModified = new Set(modifiedPermissions);
    newModified.add(permissionId);
    setModifiedPermissions(newModified);

    const currentHasPermission = roleHasPermission(selectedRole, permissionId);
    const updatedPermissions = currentHasPermission
      ? selectedRole.permissions.filter(p => p.id !== permissionId)
      : [...selectedRole.permissions, { id: permissionId, resource: "", action: "" }];

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedRole || modifiedPermissions.size === 0) return;

    setIsSaving(true);
    try {
      showSuccess("تغییرات با موفقیت ذخیره شد");
      setModifiedPermissions(new Set());
      setSaveDialogOpen(false);
    } catch (error) {
      showError("خطا در ذخیره تغییرات");
    } finally {
      setIsSaving(false);
    }
  };

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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'view':
      case 'list':
        return 'bg-blue text-blue-2';
      case 'create':
        return 'bg-green text-green-2';
      case 'edit':
        return 'bg-yellow text-yellow-2';
      case 'delete':
        return 'bg-red text-red-2';
      case 'manage':
        return 'bg-purple text-purple-2';
      default:
        return 'bg-gray text-gray-2';
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
    <PermissionGateLegacy 
      permission="admin.roles.manage" 
      fallback={
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-font-s mb-4" />
          <h2 className="text-lg font-semibold text-font-s">
            دسترسی محدود
          </h2>
          <p className="text-sm text-font-s mt-2">
            شما دسترسی لازم برای مدیریت نقش‌ها و دسترسی‌ها را ندارید.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
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
          <div className="space-y-4">
            <CardWithIcon
              icon={Users}
              title="نقش‌ها"
              iconBgColor="bg-blue"
              iconColor="stroke-blue-2"
              borderColor="border-b-blue-1"
              headerClassName="pb-3"
            >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-font-s" />
                  <Input
                    placeholder="جستجو در نقش‌ها..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRoles.map((role: RoleWithPermissions) => (
                    <div
                      key={role.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRole?.id === role.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50 hover:bg-bg/50'
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
                            <p className="text-xs text-font-s mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                        {role.is_protected && (
                          <Badge variant="gray" className="text-xs">
                            محافظت شده
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-font-s">
                          {role.permissions?.length || 0} دسترسی
                        </span>
                        <Users className="h-3 w-3 text-font-s" />
                      </div>
                    </div>
                  ))}
                </div>
            </CardWithIcon>
          </div>

          <div className="lg:col-span-2">
            {selectedRole ? (
              <CardWithIcon
                icon={Shield}
                title={
                  <div className="flex items-center justify-between w-full">
                    <span>دسترسی‌های {selectedRole.name}</span>
                    {selectedRole.is_protected && (
                      <Badge variant="red">نقش محافظت شده</Badge>
                    )}
                  </div>
                }
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                titleExtra={
                  <p className="text-sm text-font-s mt-1">
                    تیک زدن یا برداشتن تیک دسترسی‌ها
                  </p>
                }
              >
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
                          
                          if (permission.is_standalone) {
                            return (
                              <div
                                key={permission.id}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  isModified ? 'border-yellow-1 bg-yellow' : 'border-purple-1 bg-purple/5'
                                }`}
                              >
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <Checkbox
                                    id={`permission-${permission.id}`}
                                    checked={hasPermission}
                                    onCheckedChange={() => togglePermission(permission.id)}
                                    disabled={selectedRole.is_protected && !checkUserPermission("admin.roles.manage")}
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
                                        className="text-xs bg-purple text-purple-2 border-purple-1"
                                      >
                                        دسترسی کلی
                                      </Badge>
                                    </div>
                                    {permission.description && (
                                      <p className="text-xs text-font-s mt-1">
                                        {permission.description}
                                      </p>
                                    )}
                                    <div className="text-xs text-font-s mt-2 italic">
                                      این ماژول فقط یک دسترسی کلی دارد
                                    </div>
                                  </label>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div
                              key={permission.id}
                              className={`p-3 rounded-lg border transition-all ${
                                isModified ? 'border-yellow-1 bg-yellow' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={hasPermission}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                  disabled={selectedRole.is_protected && !checkUserPermission("admin.roles.manage")}
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
                                    <p className="text-xs text-font-s mt-1">
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
              </CardWithIcon>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-font-s mb-4" />
                  <h3 className="text-lg font-semibold text-font-s">
                    نقشی انتخاب نشده
                  </h3>
                  <p className="text-sm text-font-s mt-2">
                    برای مشاهده و ویرایش دسترسی‌ها، یک نقش انتخاب کنید.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

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
    </PermissionGateLegacy>
  );
} 