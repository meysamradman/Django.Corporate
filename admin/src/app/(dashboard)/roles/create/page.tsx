"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateRole, usePermissions } from "@/components/auth/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Checkbox } from "@/components/elements/Checkbox";
import { Save, Loader2, Users, Image, FileText, Settings, BarChart3, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { getPermissionTranslation } from "@/core/messages/permissions";


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
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

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

  const onSubmit = async (data: RoleFormData) => {
    try {
      console.log('Submitting role with permissions:', selectedPermissions);
      const result = await createRoleMutation.mutateAsync({
        ...data,
        permission_ids: selectedPermissions.length > 0 ? selectedPermissions : undefined,
      });
      
      router.push("/roles");
    } catch (error) {
      console.error("❌ Create role error:", error);
    }
  };

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

  const organizedPermissions = getOrganizedPermissions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">ایجاد نقش جدید</h1>
      </div>

      {/* Form */}
      <div className="space-y-6">
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
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">
                      دسترسی‌های انتخاب شده: {selectedPermissions.length}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
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
                    <Loader2 className="h-4 w-4 animate-spin" />
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
      </div>
    </div>
  );
}