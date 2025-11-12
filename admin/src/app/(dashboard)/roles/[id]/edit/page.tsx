"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole, useUpdateRole, usePermissions, useBasePermissions } from "@/components/auth/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Checkbox } from "@/components/elements/Checkbox";
import { Badge } from "@/components/elements/Badge";
import { ArrowLeft, Save, Loader2, Shield, Users, Image, FileText, Settings, BarChart3 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/elements/Table";
import { getPermissionTranslation } from "@/core/messages/permissions";

const roleSchema = z.object({
  name: z.string().min(2, "نام نقش باید حداقل 2 کاراکتر باشد"),
  description: z.string().optional(),
  permission_ids: z.array(z.number()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

// Get icon based on resource name
const getResourceIcon = (resourceName: string) => {
    const lowerResourceName = resourceName.toLowerCase();
    
    if (lowerResourceName.includes('admin') || lowerResourceName.includes('user')) {
      return <Users className="h-4 w-4" />;
    } else if (lowerResourceName.includes('media')) {
      return <Image className="h-4 w-4" />;
    } else if (lowerResourceName.includes('portfolio') || lowerResourceName.includes('blog')) {
      return <FileText className="h-4 w-4" />;
    } else if (lowerResourceName.includes('statistics') || lowerResourceName.includes('analytics')) {
      return <BarChart3 className="h-4 w-4" />;
    } else if (lowerResourceName.includes('settings') || lowerResourceName.includes('panel')) {
      return <Settings className="h-4 w-4" />;
    } else {
      return <Shield className="h-4 w-4" />;
    }
};

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  const resolvedParams = React.use(params);
  const roleId = parseInt(resolvedParams.id);
  const updateRoleMutation = useUpdateRole();
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const { data: basePermissions } = useBasePermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  // Set form data when role is loaded
  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || "",
      });
    }
  }, [role, reset]);

  // Set selected permissions based on role's current permissions + base permissions
  useEffect(() => {
    if (role && permissions) {
      // Get base permission IDs (these should always be selected)
      const basePermissionIds = getBasePermissionIds(permissions);
      
      // Get role-specific permission IDs
      const rolePermissionIds: number[] = [];
      
      // ✅ FIX: Handle empty or malformed permissions
      const roleModules = role.permissions?.modules || [];
      const roleActions = role.permissions?.actions || [];
      
      // If role has no permissions, only use base permissions
      if (roleModules.length === 0 && roleActions.length === 0) {
        setSelectedPermissions([...basePermissionIds]);
        return;
      }
      
      // Convert role permissions structure to individual permission IDs
      permissions.forEach(group => {
        group.permissions.forEach(permission => {
          // Skip base permissions as they're already added
          if (basePermissionIds.includes(permission.id)) {
            return;
          }
          
          // ✅ FIX: Better handling of 'all' and specific modules/actions
          const hasModule = roleModules.includes('all') || 
                           roleModules.includes(permission.resource);
          const hasAction = roleActions.includes('all') || 
                           roleActions.includes(permission.action?.toLowerCase());
          
          if (hasModule && hasAction) {
            rolePermissionIds.push(permission.id);
          }
        });
      });
      
      // Combine base and role permissions
      setSelectedPermissions([...basePermissionIds, ...rolePermissionIds]);
    }
  }, [role, permissions]);
  
  // Helper function to get base permission IDs from API
  const getBasePermissionIds = (permissionGroups: any[]) => {
    if (!basePermissions) return [];
    
    const basePermissionIds: number[] = [];
    
    // Use base permissions from API
    basePermissions.forEach((basePerm: any) => {
      permissionGroups.forEach(group => {
        group.permissions.forEach((permission: any) => {
          if (permission.resource === basePerm.resource && 
              permission.action === basePerm.action) {
            basePermissionIds.push(permission.id);
          }
        });
      });
    });
    
    return basePermissionIds;
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const toggleAllResourcePermissions = (resourcePermissions: any[]) => {
    // Get all permission IDs for this resource
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    
    // Check if all permissions for this resource are currently selected
    const allSelected = resourcePermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Deselect all permissions for this resource
      setSelectedPermissions(prev => prev.filter(id => !resourcePermissionIds.includes(id)));
    } else {
      // Select all permissions for this resource
      setSelectedPermissions(prev => {
        const newSelected = [...prev];
        resourcePermissionIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const isPermissionSelected = (permissionId: number | undefined) => {
    if (!permissionId) return false;
    return selectedPermissions.includes(permissionId);
  };

  const areAllResourcePermissionsSelected = (resourcePermissions: any[]) => {
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    return resourcePermissionIds.every(id => selectedPermissions.includes(id));
  };

  // Group permissions by resource and organize actions
  const getOrganizedPermissions = () => {
    if (!permissions) return [];
    
    // Create a map of resources and their permissions
    const resourceMap: Record<string, any> = {};
    
    permissions.forEach(group => {
      if (!resourceMap[group.resource]) {
        resourceMap[group.resource] = {
          resource: group.resource,
          display_name: group.display_name,
          permissions: []
        };
      }
      
      // Add all permissions for this resource
      resourceMap[group.resource].permissions.push(...group.permissions);
    });
    
    // Convert to array
    return Object.values(resourceMap);
  };

  // Get specific action permission for a resource
  const getActionPermission = (resourcePermissions: any[], action: string) => {
    // List of possible action names for each type
    const actionVariants: Record<string, string[]> = {
      'view': ['view', 'list', 'read', 'get'],
      'create': ['create', 'post', 'write', 'add'],
      'edit': ['edit', 'update', 'put', 'patch', 'modify'],
      'delete': ['delete', 'remove', 'destroy']
    };
    
    const variants = actionVariants[action] || [action];
    
    return resourcePermissions.find(p => 
      variants.includes(p.action.toLowerCase())
    );
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      await updateRoleMutation.mutateAsync({
        id: roleId,
        data: {
          ...data,
          permission_ids: selectedPermissions.length > 0 ? selectedPermissions : undefined,
        },
      });
      router.push("/admin/roles");
    } catch (error) {
      console.error("Update role error:", error);
    }
  };

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4" />
            بازگشت
          </Button>
          <div>
            <div className="h-8 w-48 bg-bg animate-pulse rounded" />
            <div className="h-4 w-32 bg-bg animate-pulse rounded mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-24 bg-bg animate-pulse rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-16 bg-bg animate-pulse rounded" />
                  <div className="h-10 w-full bg-bg animate-pulse rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-20 bg-bg animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-bg animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft />
            بازگشت
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-font-s">داده‌ای یافت نشد</p>
        </div>
      </div>
    );
  }

  const organizedPermissions = getOrganizedPermissions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          ویرایش نقش: {role.name}
        </h1>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>دسترسی‌ها</CardTitle>
            <p className="text-sm text-font-s">
              دسترسی‌های مورد نیاز برای این نقش را انتخاب کنید
            </p>
          </CardHeader>
          <CardContent>
            {permissionsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-bg animate-pulse rounded" />
                ))}
              </div>
            ) : permissionsError ? (
              <div className="text-center text-red-1 py-8">
                <p>خطا در بارگیری دسترسی‌ها</p>
                <p className="text-sm mt-2">{String(permissionsError)}</p>
              </div>
            ) : permissions && permissions.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Select all permissions
                                const allPermissionIds = organizedPermissions.flatMap(
                                  (resource: any) => resource.permissions.map((p: any) => p.id)
                                );
                                setSelectedPermissions(allPermissionIds);
                              } else {
                                // Deselect all permissions
                                setSelectedPermissions([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>منبع</TableHead>
                        <TableHead className="text-center">مشاهده</TableHead>
                        <TableHead className="text-center">ایجاد</TableHead>
                        <TableHead className="text-center">ویرایش</TableHead>
                        <TableHead className="text-center">حذف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizedPermissions.map((resource: any) => (
                        <TableRow key={resource.resource}>
                          <TableCell>
                            <Checkbox
                              checked={areAllResourcePermissionsSelected(resource.permissions)}
                              onCheckedChange={() => toggleAllResourcePermissions(resource.permissions)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getResourceIcon(resource.display_name)}
                              {getPermissionTranslation(resource.display_name, 'resource')}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isPermissionSelected(
                                  getActionPermission(resource.permissions, 'view')?.id
                                )}
                                onCheckedChange={() => {
                                  const perm = getActionPermission(resource.permissions, 'view');
                                  if (perm) togglePermission(perm.id);
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isPermissionSelected(
                                  getActionPermission(resource.permissions, 'create')?.id
                                )}
                                onCheckedChange={() => {
                                  const perm = getActionPermission(resource.permissions, 'create');
                                  if (perm) togglePermission(perm.id);
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isPermissionSelected(
                                  getActionPermission(resource.permissions, 'edit')?.id
                                )}
                                onCheckedChange={() => {
                                  const perm = getActionPermission(resource.permissions, 'edit');
                                  if (perm) togglePermission(perm.id);
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isPermissionSelected(
                                  getActionPermission(resource.permissions, 'delete')?.id
                                )}
                                onCheckedChange={() => {
                                  const perm = getActionPermission(resource.permissions, 'delete');
                                  if (perm) togglePermission(perm.id);
                                }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {selectedPermissions.length > 0 && (
                  <div className="mt-4 p-3 bg-bg/50 rounded-lg">
                    <div className="text-sm font-medium">
                      دسترسی‌های انتخاب شده: {selectedPermissions.length}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-font-s py-8">
                دسترسی‌ای موجود نیست
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایه</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">نام *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="نام نقش را وارد کنید"
                  className={errors.name ? "border-red-1" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-1 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="توضیحات نقش را وارد کنید"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={updateRoleMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateRoleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  بروزرسانی
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateRoleMutation.isPending}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}