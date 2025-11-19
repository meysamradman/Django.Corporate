"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCreateRole, usePermissions } from "@/core/permissions/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Checkbox } from "@/components/elements/Checkbox";
import {
  Save,
  Loader2,
  Users,
  Image,
  FileText,
  Settings,
  BarChart3,
  Shield,
  AlertCircle,
  ShieldCheck,
  User,
  Tag,
  FolderTree,
  ListChecks,
  LayoutPanelLeft,
  BookOpenText,
  Tags,
  Component,
  ListTree,
  Sparkles,
  Mail,
  SquarePen,
  BookOpenCheck,
  PieChart
} from "lucide-react";
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
      // Convert permission IDs to modules/actions format that backend expects
      const selectedPermsData: Array<{module: string; action: string}> = [];
      
      if (permissions) {
        permissions.forEach((group: any) => {
          group.permissions.forEach((perm: any) => {
            if (selectedPermissions.includes(perm.id)) {
              selectedPermsData.push({
                module: perm.resource,  // Backend expects 'module' not 'resource'
                action: perm.action.toLowerCase() // Backend expects lowercase
              });
            }
          });
        });
      }

      // Build permissions object in backend format
      const permissionsPayload = selectedPermsData.length > 0 
        ? { specific_permissions: selectedPermsData }
        : {};

      const payload = {
        name: data.name,
        description: data.description,
        permissions: permissionsPayload,
      };

      const result = await createRoleMutation.mutateAsync(payload);
      
      // نمایش پیام موفقیت
      showSuccessToast(msg.ui("roleCreated"));
      
      // انتقال به صفحه لیست
      router.push("/roles");
    } catch (error: any) {
      console.error("Role creation error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
      });

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

  const resourceIconMap: Record<string, React.ReactElement> = {
    users: <Users className="h-4 w-4 text-blue-600" />,
    admin: <ShieldCheck className="h-4 w-4 text-purple-600" />,
    media: <Image className="h-4 w-4 text-pink-600" />,
    portfolio: <LayoutPanelLeft className="h-4 w-4 text-indigo-600" />,
    blog: <BookOpenText className="h-4 w-4 text-green-600" />,
    blog_categories: <FolderTree className="h-4 w-4 text-emerald-600" />,
    blog_tags: <Tags className="h-4 w-4 text-teal-600" />,
    portfolio_categories: <Component className="h-4 w-4 text-cyan-600" />,
    portfolio_tags: <Tag className="h-4 w-4 text-sky-600" />,
    portfolio_options: <ListTree className="h-4 w-4 text-violet-600" />,
    portfolio_option_values: <ListChecks className="h-4 w-4 text-fuchsia-600" />,
    analytics: <BarChart3 className="h-4 w-4 text-amber-600" />,
    statistics: <PieChart className="h-4 w-4 text-orange-600" />,
    panel: <Settings className="h-4 w-4 text-slate-600" />,
    settings: <Settings className="h-4 w-4 text-gray-600" />,
    ai: <Sparkles className="h-4 w-4 text-yellow-600" />,
    email: <Mail className="h-4 w-4 text-red-600" />,
    forms: <SquarePen className="h-4 w-4 text-lime-600" />,
    pages: <BookOpenCheck className="h-4 w-4 text-rose-600" />
  };

  const getResourceIcon = (resourceKey: string) => {
    const iconMap = resourceIconMap[resourceKey];
    return iconMap || <Shield className="h-4 w-4" />;
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
      'delete': ['delete', 'remove', 'destroy'],
      'manage': ['manage', 'admin']
    };
    
    const variants = actionVariants[action] || [action];
    
    return resourcePermissions.find(p => 
      variants.includes(p.action.toLowerCase())
    );
  };

  // Check if resource should be in management section
  const isManagementResource = (resource: any) => {
    const name = resource.resource?.toLowerCase() || '';
    const perms = resource.permissions || [];

    // 1. FORCE these specific resources to always be in management section
    const forcedManagementResources = ['pages', 'settings', 'panel', 'forms', 'ai', 'statistics', 'analytics'];
    if (forcedManagementResources.includes(name)) {
      return true;
    }
    
    // 2. For others, check if they lack standard actions
    const standardActions = ['create', 'post', 'write', 'add', 
                             'edit', 'update', 'put', 'patch', 'modify', 
                             'delete', 'remove', 'destroy'];
    
    const hasStandardAction = perms.some((p: any) => {
      const action = p.action?.toLowerCase() || '';
      return standardActions.includes(action);
    });
    
    return !hasStandardAction;
  };

  // ✅ FIX: Memoize organizedPermissions to prevent re-computation
  const organizedPermissions = useMemo(() => getOrganizedPermissions(), [permissions]);

  // Logic Update: Separating based on explicit list AND action types
  const manageOnlyResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => isManagementResource(r));
  }, [organizedPermissions]);

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => !isManagementResource(r));
  }, [organizedPermissions]);

  // Backward compatibility for logic check (optional, but keeping clean)
  const hasManageOnlyResources = manageOnlyResources.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">ایجاد نقش جدید</h1>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Permissions */}
        <CardWithIcon
          icon={ShieldCheck}
          title="دسترسی‌ها"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          className="hover:shadow-lg transition-all duration-300"
          titleExtra={
            <p className="text-sm text-font-s mt-2">
              دسترسی‌های مورد نیاز برای این نقش را انتخاب کنید
            </p>
          }
        >
            {permissionsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-bg animate-pulse rounded" />
                ))}
              </div>
            ) : permissionsError ? (
              <div className="text-center text-destructive py-8">
                <p>خطا در بارگیری دسترسی‌ها</p>
                <p className="text-sm mt-2">{String(permissionsError)}</p>
              </div>
            ) : permissions && permissions.length > 0 ? (
              <div className="space-y-8">
                {/* Standard Resources Table */}
                {standardResources.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              onCheckedChange={(checked) => {
                                const permissionIds = standardResources.flatMap(
                                  (resource: any) => resource.permissions.map((p: any) => p.id)
                                );
                                
                                const newSelected = checked
                                  ? [...selectedPermissions, ...permissionIds.filter(id => !selectedPermissions.includes(id))]
                                  : selectedPermissions.filter(id => !permissionIds.includes(id));
                                  
                                setSelectedPermissions(newSelected);
                                setValue("permission_ids", newSelected, { shouldValidate: true });
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
                        {standardResources.map((resource: any) => (
                          <TableRow key={resource.resource}>
                            <TableCell>
                              <Checkbox
                                checked={areAllResourcePermissionsSelected(resource.permissions)}
                                onCheckedChange={() => toggleAllResourcePermissions(resource.permissions)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getResourceIcon(resource.resource)}
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
                )}

                {/* Management-Only Modules (Settings, Analytics, etc.) */}
                {manageOnlyResources.length > 0 && (
                  <Card className="border-2 border-dashed border-blue-0 bg-blue">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-1/10">
                            <Settings className="h-5 w-5 text-blue-1" />
                          </div>
                          <div>
                            <CardTitle>ماژول‌های تنظیمات و گزارش‌گیری</CardTitle>
                            <p className="text-sm text-font-s mt-1">
                              دسترسی مدیریت کلی (بدون CRUD جداگانه)
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-font-s">
                          {manageOnlyResources.filter((r: any) => {
                            const perm = getActionPermission(r.permissions, 'manage') || r.permissions[0];
                            return perm && isPermissionSelected(perm.id);
                          }).length} / {manageOnlyResources.length}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {manageOnlyResources.map((resource: any) => {
                          const managePerm = getActionPermission(resource.permissions, 'manage') || resource.permissions[0];
                          if (!managePerm) return null;
                          
                          const isSelected = isPermissionSelected(managePerm.id);

                          return (
                            <div 
                              key={resource.resource}
                              onClick={() => togglePermission(managePerm.id)}
                              className={`group relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${isSelected ? 'border-blue-1 bg-blue-0' : 'border-br bg-card hover:border-blue-0'}`}
                            >
                              <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-1/20' : 'bg-bg group-hover:bg-blue-0/50'}`}>
                                {getResourceIcon(resource.resource)}
                              </div>
                              <span className={`text-center text-sm font-medium leading-tight ${isSelected ? 'text-blue-1' : 'text-font-p'}`}>
                                {getPermissionTranslation(resource.display_name, 'resource')}
                              </span>
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-1 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-wt" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedPermissions.length > 0 && (
                  <div className="p-3 bg-bg/50 rounded-lg">
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
              <div className="text-center text-font-s py-8">
                دسترسی‌ای موجود نیست
              </div>
            )}
        </CardWithIcon>

        {/* Basic Info */}
        <CardWithIcon
          icon={User}
          title="اطلاعات پایه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          className="hover:shadow-lg transition-all duration-300"
        >
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
        </CardWithIcon>
      </div>
    </div>
  );
}