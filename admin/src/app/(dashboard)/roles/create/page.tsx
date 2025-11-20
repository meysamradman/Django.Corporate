"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCreateRole, usePermissions, useBasePermissions } from "@/core/permissions/hooks/useRoles";
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
  PieChart,
  LayoutDashboard
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { roleFormSchema, roleFormDefaults, RoleFormValues } from "@/core/validations/roleSchema";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { extractFieldErrors, hasFieldErrors, showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";

// ✅ OPTIMIZED: Statistics permissions that are actually used (defined once, reused)
const STATISTICS_USED_PERMISSIONS: readonly string[] = [
  'statistics.users.read',
  'statistics.admins.read',
  'statistics.content.read'
];

export default function CreateRolePage() {
  const router = useRouter();

  const createRoleMutation = useCreateRole();
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const { data: basePermissions } = useBasePermissions();
  
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
      const selectedPermsData: Array<{module: string; action: string; permission_key?: string}> = [];
      
      if (permissions) {
        permissions.forEach((group: any) => {
          group.permissions.forEach((perm: any) => {
            if (selectedPermissions.includes(perm.id)) {
              // ✅ FIX: Always use original_key if available for exact permission matching
              // This ensures backend can match the exact permission, not just module+action
              if (perm.original_key) {
                selectedPermsData.push({
                  module: perm.resource,
                  action: perm.action.toLowerCase(),
                  permission_key: perm.original_key // ✅ Add original_key for all permissions
                });
              } else {
                selectedPermsData.push({
                  module: perm.resource,  // Backend expects 'module' not 'resource'
                  action: perm.action.toLowerCase() // Backend expects lowercase
                });
              }
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
      
      // ✅ FIX: Toast is already shown in useCreateRole hook, no need to show again
      // showSuccessToast(msg.ui("roleCreated")); // Removed to avoid duplicate toast
      
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
    dashboard: <LayoutDashboard className="h-4 w-4 text-blue-600" />,
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

  // Helper function to get base permission IDs from API
  const getBasePermissionIds = (permissionGroups: any[]) => {
    if (!basePermissions || !Array.isArray(basePermissions)) return [];
    
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

  // Group permissions by resource and organize actions
  const getOrganizedPermissions = () => {
    if (!permissions) return [];
    
    // Get base permission IDs to exclude them from the form
    // Base permissions (dashboard.read, profile.read, profile.update) are automatically granted to all admins
    const basePermissionIds = getBasePermissionIds(permissions);
    
    // Create a map of resources and their permissions
    const resourceMap: Record<string, any> = {};
    
    permissions.forEach(group => {
      // Filter out base permissions
      const filteredPermissions = group.permissions.filter((p: any) => !basePermissionIds.includes(p.id));
      
      // Skip if no permissions left after filtering
      if (filteredPermissions.length === 0) return;
      
      if (!resourceMap[group.resource]) {
        resourceMap[group.resource] = {
          resource: group.resource,
          display_name: group.display_name,
          permissions: []
        };
      }
      
      // Add filtered permissions for this resource
      resourceMap[group.resource].permissions.push(...filteredPermissions);
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
    const perms = resource.permissions || [];

    // 1. Source of Truth: Check if any permission has is_standalone flag from backend
    // This aligns perfectly with Backend/src/user/permissions/config.py
    // Only these 5 have is_standalone=True: panel, pages, forms, settings, ai
    const hasStandalonePermission = perms.some((p: any) => p.is_standalone);
    if (hasStandalonePermission) {
      return true;
    }
    
    // 2. For others, check if they lack standard CRUD actions
    // Statistics has CRUD permissions (read, export, manage) so should NOT be in management section
    const standardActions = ['create', 'post', 'write', 'add', 
                             'edit', 'update', 'put', 'patch', 'modify', 
                             'delete', 'remove', 'destroy', 'read', 'export'];
    
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

  // Separate statistics from standard resources
  const statisticsResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => r.resource === 'statistics');
  }, [organizedPermissions]);

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => !isManagementResource(r) && r.resource !== 'statistics');
  }, [organizedPermissions]);

  // Backward compatibility for logic check (optional, but keeping clean)
  const hasManageOnlyResources = manageOnlyResources.length > 0;

  // 🔥 Smart Warning Logic: Check for resources with actions but no view permission
  const logicalPermissionErrors = useMemo(() => {
    const errors: string[] = [];
    
    standardResources.forEach((resource: any) => {
      const viewPerm = getActionPermission(resource.permissions, 'view');
      
      // Skip if resource doesn't have a view permission (unlikely for standard resources)
      if (!viewPerm) return;
      
      const hasView = isPermissionSelected(viewPerm.id);
      
      // Check if any other action is selected
      const otherActions = ['create', 'edit', 'delete'];
      const hasOtherAction = otherActions.some(action => {
        const perm = getActionPermission(resource.permissions, action);
        return perm && isPermissionSelected(perm.id);
      });
      
      if (hasOtherAction && !hasView) {
        errors.push(resource.resource);
      }
    });
    
    return errors;
  }, [standardResources, selectedPermissions]);

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
                
                {/* 🔥 Smart Warning Alert */}
                {logicalPermissionErrors.length > 0 && (
                  <div className="rounded-lg border border-amber-1 bg-amber p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-0 rounded-full shrink-0 border border-amber-1">
                        <AlertCircle className="h-5 w-5 text-amber-2" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-amber-2">توجه: دسترسی‌های ناقص شناسایی شد</h4>
                        <p className="text-sm text-font-s leading-relaxed">
                          شما برای برخی ماژول‌ها دسترسی عملیاتی (ایجاد، ویرایش یا حذف) داده‌اید، اما دسترسی <strong>«مشاهده»</strong> را فعال نکرده‌اید.
                          <br />
                          کاربران بدون دسترسی مشاهده، معمولاً نمی‌توانند وارد بخش مربوطه شوند تا عملیاتی انجام دهند.
                        </p>
                        <div className="pt-2 flex flex-wrap gap-2">
                          {logicalPermissionErrors.map(resourceKey => {
                            const resource = standardResources.find((r: any) => r.resource === resourceKey);
                            return (
                              <span key={resourceKey} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-0 text-amber-2 border border-amber-1">
                                {resource ? getPermissionTranslation(resource.display_name, 'resource') : resourceKey}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                            <TableCell className="text-center relative">
                              <div className="flex justify-center relative">
                                <div className="relative">
                                  <Checkbox
                                    checked={isPermissionSelected(
                                      getActionPermission(resource.permissions, 'view')?.id
                                    )}
                                    onCheckedChange={() => {
                                      const perm = getActionPermission(resource.permissions, 'view');
                                      if (perm) togglePermission(perm.id);
                                    }}
                                    className={logicalPermissionErrors.includes(resource.resource) ? "border-amber-1 data-[state=unchecked]:bg-amber" : ""}
                                  />
                                  {logicalPermissionErrors.includes(resource.resource) && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-1 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-1 border-2 border-white"></span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center relative group">
                                <Checkbox
                                  checked={isPermissionSelected(
                                    getActionPermission(resource.permissions, 'create')?.id
                                  )}
                                  onCheckedChange={() => {
                                    const perm = getActionPermission(resource.permissions, 'create');
                                    if (perm) togglePermission(perm.id);
                                  }}
                                />
                                {getActionPermission(resource.permissions, 'create')?.requires_superadmin && (
                                  <div className="absolute -top-2 -right-3 text-amber-500" title="نیازمند دسترسی سوپر ادمین">
                                    <Shield className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center relative group">
                                <Checkbox
                                  checked={isPermissionSelected(
                                    getActionPermission(resource.permissions, 'edit')?.id
                                  )}
                                  onCheckedChange={() => {
                                    const perm = getActionPermission(resource.permissions, 'edit');
                                    if (perm) togglePermission(perm.id);
                                  }}
                                />
                                {getActionPermission(resource.permissions, 'edit')?.requires_superadmin && (
                                  <div className="absolute -top-2 -right-3 text-amber-500" title="نیازمند دسترسی سوپر ادمین">
                                    <Shield className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center relative group">
                                <Checkbox
                                  checked={isPermissionSelected(
                                    getActionPermission(resource.permissions, 'delete')?.id
                                  )}
                                  onCheckedChange={() => {
                                    const perm = getActionPermission(resource.permissions, 'delete');
                                    if (perm) togglePermission(perm.id);
                                  }}
                                />
                                {getActionPermission(resource.permissions, 'delete')?.requires_superadmin && (
                                  <div className="absolute -top-2 -right-3 text-amber-500" title="نیازمند دسترسی سوپر ادمین">
                                    <Shield className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Statistics Permissions - Separate Card */}
                {statisticsResources.length > 0 && statisticsResources[0]?.permissions?.length > 0 && (
                  <Card className="border-2 border-dashed border-blue-0 bg-blue">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-1/10">
                            <PieChart className="h-5 w-5 text-blue-1" />
                          </div>
                          <div>
                            <CardTitle>آمار و گزارش‌ها</CardTitle>
                            <p className="text-sm text-font-s mt-1">
                              دسترسی به آمارهای مختلف سیستم
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-font-s">
                          {statisticsResources[0].permissions.filter((p: any) => 
                            isPermissionSelected(p.id)
                          ).length} / {statisticsResources[0].permissions.length}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {statisticsResources[0].permissions
                          .filter((perm: any) => {
                            // فقط permissions هایی که واقعاً استفاده می‌شوند را نمایش بده
                            return STATISTICS_USED_PERMISSIONS.includes(perm.original_key);
                          })
                          .map((perm: any) => {
                          const isSelected = isPermissionSelected(perm.id);

                          return (
                            <div 
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={`group relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${isSelected ? 'border-blue-1 bg-blue-0' : 'border-br bg-card hover:border-blue-0'}`}
                            >
                              <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-1/20' : 'bg-bg group-hover:bg-blue-0/50'}`}>
                                {getResourceIcon('statistics')}
                              </div>
                              <span className={`text-center text-sm font-medium leading-tight ${isSelected ? 'text-blue-1' : 'text-font-p'}`}>
                                {getPermissionTranslation(perm.display_name, 'description')}
                              </span>
                              {perm.requires_superadmin && (
                                <div className="absolute top-2 right-2 text-amber-500" title="نیازمند دسترسی سوپر ادمین">
                                  <Shield className="h-3 w-3" />
                                </div>
                              )}
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
                            // ✅ FIX: Find manage permission more reliably
                            const perm = r.permissions.find((p: any) => 
                              p.action?.toLowerCase() === 'manage' || p.is_standalone
                            ) || r.permissions[0];
                            return perm && perm.id && isPermissionSelected(perm.id);
                          }).length} / {manageOnlyResources.length}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {manageOnlyResources.map((resource: any) => {
                          // ✅ FIX: Find manage permission more reliably
                          const managePerm = resource.permissions.find((p: any) => 
                            p.action?.toLowerCase() === 'manage' || p.is_standalone
                          ) || resource.permissions[0];
                          
                          if (!managePerm || !managePerm.id) return null;
                          
                          const isSelected = isPermissionSelected(managePerm.id);

                          return (
                            <div 
                              key={`${resource.resource}-${managePerm.id}`}
                              onClick={() => togglePermission(managePerm.id)}
                              className={`group relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${isSelected ? 'border-blue-1 bg-blue-0' : 'border-br bg-card hover:border-blue-0'}`}
                            >
                              <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-1/20' : 'bg-bg group-hover:bg-blue-0/50'}`}>
                                {getResourceIcon(resource.resource)}
                              </div>
                              <span className={`text-center text-sm font-medium leading-tight ${isSelected ? 'text-blue-1' : 'text-font-p'}`}>
                                {getPermissionTranslation(resource.display_name, 'resource')}
                              </span>
                              {managePerm.requires_superadmin && (
                                <div className="absolute top-2 right-2 text-amber-500" title="نیازمند دسترسی سوپر ادمین">
                                  <Shield className="h-3 w-3" />
                                </div>
                              )}
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