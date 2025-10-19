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
import { ArrowLeft, Save, ChevronDown, ChevronRight, Shield } from "lucide-react";


const roleSchema = z.object({
  name: z.string().min(2, "نام نقش باید حداقل 2 کاراکتر باشد"),
  description: z.string().optional(),
  permission_ids: z.array(z.number()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  const resolvedParams = React.use(params);
  const roleId = parseInt(resolvedParams.id);
  const updateRoleMutation = useUpdateRole();
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();
  const { data: basePermissions } = useBasePermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

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
    if (role && role.permissions && permissions) {
      const currentPermissions: number[] = [];
      
      // Add base permission IDs (these should always be selected)
      const basePermissionIds = getBasePermissionIds(permissions);
      currentPermissions.push(...basePermissionIds);
      
      // Convert role permissions structure to individual permission IDs
      permissions.forEach(group => {
        group.permissions.forEach(permission => {
          // Skip base permissions as they're already added
          if (basePermissionIds.includes(permission.id)) {
            return;
          }
          
          // Check if this permission should be selected based on role's modules and actions
          const hasModule = role.permissions.modules?.includes('all') || 
                           role.permissions.modules?.includes(permission.resource);
          const hasAction = role.permissions.actions?.includes('all') || 
                           role.permissions.actions?.includes(permission.action.toLowerCase());
          
          if (hasModule && hasAction) {
            currentPermissions.push(permission.id);
          }
        });
      });
      
      setSelectedPermissions(currentPermissions);
      console.log('Set selected permissions from role:', currentPermissions);
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

  const toggleResource = (resource: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedResources(newExpanded);
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

  const toggleResourcePermissions = (resource: string, permissionIds: number[]) => {
    const resourcePermissions = permissionIds.filter(id => {
      const permission = permissions?.find(group => 
        group.permissions.some(p => p.id === id)
      )?.permissions.find(p => p.id === id);
      return permission?.resource === resource;
    });

    const allSelected = resourcePermissions.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Remove all permissions for this resource
      setSelectedPermissions(prev => prev.filter(id => !resourcePermissions.includes(id)));
    } else {
      // Add all permissions for this resource
      setSelectedPermissions(prev => {
        const newSelected = [...prev];
        resourcePermissions.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
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
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" />
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
          <p className="text-muted-foreground">داده‌ای یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          ویرایش نقش: {role.name}
        </h1>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایه</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">نام نقش *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="نام نقش را وارد کنید"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              دسترسی‌ها
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              دسترسی‌های مربوط به این نقش را انتخاب کنید
            </p>
          </CardHeader>
          <CardContent>
            {/* Base Permissions Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-blue-700 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                🟢 دسترسی‌های پایه:
              </h4>
              <p className="text-xs text-blue-600 mb-2">این دسترسی‌ها به صورت خودکار به همه ادمین‌ها تعلق دارد:</p>
              <div className="flex flex-wrap gap-1">
                {basePermissions ? (
                  basePermissions.map((basePerm: any) => (
                    <Badge key={basePerm.id} variant="default">
                      {basePerm.display_name}
                    </Badge>
                  ))
                ) : (
                  // Fallback
                  <>
                    <Badge variant="default">مشاهده Dashboard</Badge>
                    <Badge variant="default">مشاهده Media</Badge>
                    <Badge variant="default">ویرایش پروفایل</Badge>
                  </>
                )}
              </div>
            </div>
            
            {permissionsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : permissions && permissions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {permissions.map((group) => {
                  // Check if this group contains base permissions
                  const basePermissionIds = getBasePermissionIds([group]);
                  const hasBasePermissions = basePermissionIds.length > 0;
                  
                  return (
                    <div key={group.resource} className="border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div
                        onClick={() => toggleResource(group.resource)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 cursor-pointer rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {expandedResources.has(group.resource) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-base">{group.display_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {group.permissions.length} دسترسی
                            </span>
                          </div>
                          {hasBasePermissions && (
                            <Badge variant="blue" className="text-xs">پایه</Badge>
                          )}
                        </div>
                        <Checkbox
                          checked={group.permissions.every(p => selectedPermissions.includes(p.id))}
                          onCheckedChange={() => toggleResourcePermissions(
                            group.resource, 
                            group.permissions.map(p => p.id)
                          )}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-md"
                        />
                      </div>
                      
                      {expandedResources.has(group.resource) && (
                        <div className="border-t p-4 bg-muted/30 rounded-b-lg space-y-3">
                          {group.permissions.map((permission) => {
                            const isBasePermission = getBasePermissionIds([group]).includes(permission.id);
                            
                            return (
                              <div key={permission.id} className="flex items-start gap-3 p-3 bg-background rounded-md border">
                                <Checkbox
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => {
                                    if (!isBasePermission) {
                                      togglePermission(permission.id);
                                    }
                                  }}
                                  disabled={isBasePermission}
                                  className="mt-0.5 rounded-md"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{permission.action}</span>
                                    {isBasePermission && (
                                      <Badge variant="blue" className="text-xs">پایه</Badge>
                                    )}
                                  </div>
                                  {permission.description && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {permission.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                دسترسی‌ای یافت نشد
              </div>
            )}
            
            {selectedPermissions.length > 0 && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  دسترسی‌های انتخاب شده: {selectedPermissions.length}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}