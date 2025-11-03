"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateRole, usePermissions } from "@/components/auth/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Checkbox } from "@/components/elements/Checkbox";
import { Save, Loader2, Users, Image, FileText, Settings, BarChart3, Shield, AlertCircle, ShieldCheck, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { roleFormSchema, roleFormDefaults, RoleFormValues } from "@/core/validations/roleSchema";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { extractFieldErrors, hasFieldErrors, showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";

export default function CreateRolePage() {
  const router = useRouter();

  const createRoleMutation = useCreateRole();
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema) as any,
    defaultValues: roleFormDefaults as any,
  });

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      const newPermissions = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      
      // Sync با form
      setValue("permission_ids", newPermissions, { shouldValidate: true });
      
      return newPermissions;
    });
  };

  const toggleAllResourcePermissions = (resourcePermissions: any[]) => {
    // Get all permission IDs for this resource
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    
    // Check if all permissions for this resource are currently selected
    const allSelected = resourcePermissionIds.every(id => selectedPermissions.includes(id));
    
    setSelectedPermissions(prev => {
      const newSelected = allSelected
        ? prev.filter(id => !resourcePermissionIds.includes(id))
        : (() => {
            const updated = [...prev];
            resourcePermissionIds.forEach(id => {
              if (!updated.includes(id)) {
                updated.push(id);
              }
            });
            return updated;
          })();
      
      // Sync با form
      setValue("permission_ids", newSelected, { shouldValidate: true });
      
      return newSelected;
    });
  };

  const isPermissionSelected = (permissionId: number | undefined) => {
    if (!permissionId) return false;
    return selectedPermissions.includes(permissionId);
  };

  const areAllResourcePermissionsSelected = (resourcePermissions: any[]) => {
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    return resourcePermissionIds.every(id => selectedPermissions.includes(id));
  };

  const onSubmit = async (data: RoleFormValues) => {
    try {
      console.log('Submitting role with permissions:', data.permission_ids);
      const result = await createRoleMutation.mutateAsync({
        ...data,
        permission_ids: data.permission_ids,
      });
      
      // نمایش پیام موفقیت
      showSuccessToast(msg.ui("roleCreated"));
      
      // انتقال به صفحه لیست
      router.push("/roles");
    } catch (error) {
      console.error("❌ Create role error:", error);
      
      // بررسی خطاهای فیلدها از Django
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        // Set کردن خطاها در فرم
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as any, {
            type: 'server',
            message: message as string
          });
        });
        
        // نمایش پیام خطای کلی
        showErrorToast(error, "لطفاً خطاهای فرم را بررسی کنید");
      } else {
        // نمایش خطای عمومی
        showErrorToast(error);
      }
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
        <h1>ایجاد نقش جدید</h1>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Permissions */}
        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                <ShieldCheck className="w-5 h-5 stroke-indigo-600" />
              </div>
              دسترسی‌ها
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              دسترسی‌های مورد نیاز برای این نقش را انتخاب کنید
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {permissionsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : permissionsError ? (
              <div className="text-center text-destructive py-8">
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
                              const allPermissionIds = organizedPermissions.flatMap(
                                (resource: any) => resource.permissions.map((p: any) => p.id)
                              );
                              
                              const newPermissions = checked ? allPermissionIds : [];
                              setSelectedPermissions(newPermissions);
                              
                              // Sync با form
                              setValue("permission_ids", newPermissions, { shouldValidate: true });
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
                
                {/* نمایش خطا برای دسترسی‌ها */}
                {errors.permission_ids?.message && (
                  <div className="flex items-start gap-2 text-sm text-destructive mt-4 p-3 bg-destructive/10 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{String(errors.permission_ids.message)}</span>
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
        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
                <User className="w-5 h-5 stroke-primary" />
              </div>
              اطلاعات پایه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormFieldInput
                label="نام"
                id="name"
                required
                error={errors.name?.message}
                placeholder="نام نقش را وارد کنید"
                {...register("name")}
              />

              <FormFieldTextarea
                label="توضیحات"
                id="description"
                error={errors.description?.message}
                placeholder="توضیحات نقش را وارد کنید (حداکثر ۳۰۰ کاراکتر)"
                rows={3}
                maxLength={300}
                {...register("description")}
              />

              <div className="flex gap-4 justify-end">
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