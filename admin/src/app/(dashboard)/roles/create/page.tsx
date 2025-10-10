"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateRole, usePermissions } from "@/components/auth/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Checkbox } from "@/components/elements/Checkbox";
import { Save, ChevronDown, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";


const roleSchema = z.object({
  name: z.string().min(2, "نام نقش باید حداقل 2 کاراکتر باشد"),
  description: z.string().optional(),
  permission_ids: z.array(z.number()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function CreateRolePage() {
  const router = useRouter();

  const createRoleMutation = useCreateRole();
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  
  // Debug log for permissions
  React.useEffect(() => {
    console.log('🔍 Permissions Debug:', {
      permissions,
      isLoading: permissionsLoading,
      error: permissionsError
    });
  }, [permissions, permissionsLoading, permissionsError]);
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

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
      console.log('🚀 Sending role data:', {
        ...data,
        permission_ids: selectedPermissions.length > 0 ? selectedPermissions : undefined,
      })
      
      const result = await createRoleMutation.mutateAsync({
        ...data,
        permission_ids: selectedPermissions.length > 0 ? selectedPermissions : undefined,
      });
      
      console.log('✅ Role creation success:', result)
      router.push("/roles");
    } catch (error) {
      console.error("❌ Create role error:", error);
      console.error("❌ Error details:", {
        message: (error as any)?.message,
        response: (error as any)?.response,
        stack: (error as any)?.stack
      });
    }
  };

  const getResourceDisplayName = (resource: string) => {
    return resource
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
            <div>
        <h1 className="page-title">ایجاد نقش جدید</h1>
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
                <Label htmlFor="name">نام *</Label>
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
                  disabled={createRoleMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createRoleMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  ایجاد
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createRoleMutation.isPending}
                >
                  لغو
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>دسترسی‌ها</CardTitle>
            <p className="text-sm text-muted-foreground">
              دسترسی‌های مورد نیاز برای این نقش را انتخاب کنید
            </p>
          </CardHeader>
          <CardContent>
            {permissionsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : permissionsError ? (
              <div className="text-center text-red-500 py-8">
                <p>خطا در بارگیری دسترسی‌ها</p>
                <p className="text-sm mt-2">{String(permissionsError)}</p>
              </div>
            ) : permissions && permissions.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {permissions.map((group) => (
                  <div key={group.resource} className="border rounded-lg">
                    <div
                      onClick={() => toggleResource(group.resource)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {expandedResources.has(group.resource) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{group.display_name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({group.permissions.length})
                        </span>
                      </div>
                      <Checkbox
                        checked={group.permissions.every(p => selectedPermissions.includes(p.id))}
                        onCheckedChange={() => toggleResourcePermissions(
                          group.resource, 
                          group.permissions.map(p => p.id)
                        )}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {expandedResources.has(group.resource) && (
                      <div className="border-t p-3 space-y-2">
                        {group.permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{permission.action}</div>
                              {permission.description && (
                                <div className="text-sm text-muted-foreground">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                دسترسی‌ای موجود نیست
              </div>
            )}
            
            {selectedPermissions.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">
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
