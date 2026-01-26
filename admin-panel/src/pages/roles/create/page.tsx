import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateRole, usePermissions, useBasePermissions, useUserPermissions } from "@/core/permissions";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Skeleton } from "@/components/elements/Skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import {
  AlertCircle,
  ShieldCheck,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/elements/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleFormSchema, roleFormDefaults, type RoleFormValues } from "@/components/roles/validations/roleSchema";
import { extractFieldErrors, hasFieldErrors, showError } from '@/core/toast';
import { getResourceIcon } from "@/components/roles/form/utils";

const RoleBasicInfoFormSkeleton = () => (
  <CardWithIcon
    icon={ShieldCheck}
    title="اطلاعات پایه"
    iconBgColor="bg-blue"
    iconColor="stroke-blue-2"
    borderColor="border-b-blue-1"
  >
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  </CardWithIcon>
);

const StandardPermissionsTable = lazy(
  () => import("@/components/roles/form").then(mod => ({ default: mod.StandardPermissionsTable }))
);

const PermissionWarningAlert = lazy(
  () => import("@/components/roles/form").then(mod => ({ default: mod.PermissionWarningAlert }))
);

const StatisticsPermissionsCard = lazy(
  () => import("@/components/roles/form").then(mod => ({ default: mod.StatisticsPermissionsCard }))
);

const AIPermissionsCard = lazy(
  () => import("@/components/roles/form").then(mod => ({ default: mod.AIPermissionsCard }))
);


const ManagementPermissionsCard = lazy(
  () => import("@/components/roles/form").then(mod => ({ default: mod.ManagementPermissionsCard }))
);

const RoleBasicInfoForm = lazy(
  () => import("@/components/roles/form").then(mod => ({ default: mod.RoleInfoForm }))
);

// استخراج permissions از API به صورت داینامیک
const getAnalyticsPermissions = (permissions: any[]): string[] => {
  if (!permissions || !Array.isArray(permissions)) return [];
  
  const analyticsPerms: string[] = [];
  permissions.forEach((group: any) => {
    if (group.resource === 'analytics' || group.resource?.startsWith('analytics.')) {
      group.permissions?.forEach((perm: any) => {
        const originalKey = perm.original_key || `${perm.resource}.${perm.action}`;
        if (originalKey.startsWith('analytics.') && !analyticsPerms.includes(originalKey)) {
          analyticsPerms.push(originalKey);
        }
      });
    }
  });
  
  return analyticsPerms;
};

const getAIPermissions = (permissions: any[]): string[] => {
  if (!permissions || !Array.isArray(permissions)) return [];
  
  const aiPerms: string[] = [];
  permissions.forEach((group: any) => {
    if (group.resource === 'ai' || group.resource?.startsWith('ai.')) {
      group.permissions?.forEach((perm: any) => {
        const originalKey = perm.original_key || `${perm.resource}.${perm.action}`;
        if (originalKey.startsWith('ai.') && !aiPerms.includes(originalKey)) {
          aiPerms.push(originalKey);
        }
      });
    }
  });
  
  return aiPerms;
};

export default function CreateRolePage() {
  const navigate = useNavigate();

  const createRoleMutation = useCreateRole();
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const { data: basePermissions } = useBasePermissions();
  const { isSuperAdmin } = useUserPermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: roleFormDefaults,
  });

  const {
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = form;

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      const allPermissions = permissions?.flatMap((g: any) => g.permissions) || [];
      const toggledPerm = allPermissions.find((p: any) => p.id === permissionId);
      const isCurrentlySelected = prev.includes(permissionId);
      
      let newPermissions: number[];
      const originalKey = (toggledPerm as any)?.original_key || '';
      const resource = (toggledPerm as any)?.resource || '';
      const action = (toggledPerm as any)?.action || '';
      
      // ساخت original_key اگر وجود نداشت
      const permKey = originalKey || `${resource}.${action}`;
      
      // منطق برای admin.manage
      if (permKey === 'admin.manage' || (resource === 'admin' && action?.toLowerCase() === 'manage')) {
        if (isCurrentlySelected) {
          newPermissions = prev.filter(id => id !== permissionId);
        } else {
          // حذف همه permissions جزئی admin
          const adminPermissionIds = allPermissions
            .filter((p: any) => {
              const pKey = (p as any).original_key || `${(p as any).resource || ''}.${(p as any).action || ''}`;
              return (pKey.startsWith('admin.') && pKey !== 'admin.manage') || 
                     ((p as any).resource === 'admin' && (p as any).action?.toLowerCase() !== 'manage');
            })
            .map((p: any) => p.id);
          newPermissions = [...prev.filter(id => !adminPermissionIds.includes(id)), permissionId];
        }
      } 
      // اگر یکی از permissions جزئی admin انتخاب شد و admin.manage فعال است، جلوگیری کن
      else if ((permKey.startsWith('admin.') && permKey !== 'admin.manage') || 
               (resource === 'admin' && action?.toLowerCase() !== 'manage')) {
        const adminManagePerm = allPermissions.find((p: any) => {
          const pKey = (p as any).original_key || `${(p as any).resource || ''}.${(p as any).action || ''}`;
          return pKey === 'admin.manage' || ((p as any).resource === 'admin' && (p as any).action?.toLowerCase() === 'manage');
        });
        const isAdminManageSelected = adminManagePerm && prev.includes((adminManagePerm as any).id);
        
        if (isAdminManageSelected) {
          return prev; // اگر admin.manage فعال است، اجازه انتخاب permissions جزئی را نده
        }
        
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      }
      // منطق برای analytics.manage یا analytics.stats.manage
      else if (permKey === 'analytics.manage' || permKey === 'analytics.stats.manage') {
        if (isCurrentlySelected) {
          newPermissions = prev.filter(id => id !== permissionId);
        } else {
          // حذف همه permissions جزئی analytics
          const analyticsPermissionIds = allPermissions
            .filter((p: any) => {
              const pKey = (p as any).original_key || `${(p as any).resource || ''}.${(p as any).action || ''}`;
              return (pKey.startsWith('analytics.') && pKey !== 'analytics.manage' && pKey !== 'analytics.stats.manage') ||
                     ((p as any).resource === 'analytics' && (p as any).action?.toLowerCase() !== 'manage');
            })
            .map((p: any) => p.id);
          newPermissions = [...prev.filter(id => !analyticsPermissionIds.includes(id)), permissionId];
        }
      }
      // اگر یکی از permissions جزئی analytics انتخاب شد و analytics.manage فعال است، جلوگیری کن
      else if ((permKey.startsWith('analytics.') && permKey !== 'analytics.manage' && permKey !== 'analytics.stats.manage') ||
               (resource === 'analytics' && action?.toLowerCase() !== 'manage')) {
        const analyticsManagePerm = allPermissions.find((p: any) => {
          const pKey = (p as any).original_key || `${(p as any).resource || ''}.${(p as any).action || ''}`;
          return pKey === 'analytics.manage' || pKey === 'analytics.stats.manage' ||
                 ((p as any).resource === 'analytics' && (p as any).action?.toLowerCase() === 'manage');
        });
        const isAnalyticsManageSelected = analyticsManagePerm && prev.includes((analyticsManagePerm as any).id);
        
        if (isAnalyticsManageSelected) {
          return prev; // اگر analytics.manage فعال است، اجازه انتخاب permissions جزئی را نده
        }
        
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      }
      // منطق برای ai.manage
      else if (originalKey === 'ai.manage') {
        if (isCurrentlySelected) {
          newPermissions = prev.filter(id => id !== permissionId);
        } else {
          const aiPermissionIds = allPermissions
            .filter((p: any) => (p as any).original_key?.startsWith('ai.') && (p as any).original_key !== 'ai.manage')
            .map((p: any) => p.id);
          newPermissions = [...prev.filter(id => !aiPermissionIds.includes(id)), permissionId];
        }
      } 
      // اگر یکی از permissions جزئی ai انتخاب شد و ai.manage فعال است، جلوگیری کن
      else if (originalKey.startsWith('ai.')) {
        const aiManagePerm = allPermissions.find((p: any) => (p as any).original_key === 'ai.manage');
        const isAiManageSelected = aiManagePerm && prev.includes((aiManagePerm as any).id);
        
        if (isAiManageSelected) {
          return prev;
        }
        
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      } 
      // بقیه permissions
      else {
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      }
      
      setValue("permission_ids", newPermissions, { shouldValidate: true });
      
      return newPermissions;
    });
  };

  const toggleAllResourcePermissions = (resourcePermissions: any[]) => {
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    
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
      const selectedPermsData: Array<{module: string; action: string; permission_key?: string}> = [];
      
      if (permissions) {
        permissions.forEach((group: any) => {
          group.permissions.forEach((perm: any) => {
            if (selectedPermissions.includes(perm.id)) {
              if (perm.original_key) {
                selectedPermsData.push({
                  module: perm.resource,
                  action: perm.action.toLowerCase(),
                  permission_key: perm.original_key
                });
              } else {
                selectedPermsData.push({
                  module: perm.resource,
                  action: perm.action.toLowerCase()
                });
              }
            }
          });
        });
      }

      const permissionsPayload = selectedPermsData.length > 0 
        ? { specific_permissions: selectedPermsData }
        : {};

      const payload = {
        name: data.name,
        description: data.description,
        permissions: permissionsPayload,
      };

      await createRoleMutation.mutateAsync(payload);
      
      navigate("/roles");
    } catch (error: any) {

      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof RoleFormValues, {
            type: 'server',
            message: message as string
          });
        });
        
        showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
      } else {
        showError(error);
      }
    }
  };

  const getBasePermissionIds = (permissionGroups: any[]) => {
    if (!basePermissions || !Array.isArray(basePermissions)) return [];
    
    const basePermissionIds: number[] = [];
    
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

  const getOrganizedPermissions = () => {
    if (!permissions) return [];
    
    const basePermissionIds = getBasePermissionIds(permissions);
    
    const resourceMap: Record<string, any> = {};
    
    permissions.forEach(group => {
      const filteredPermissions = group.permissions.filter((p: any) => !basePermissionIds.includes(p.id));
      
      if (filteredPermissions.length === 0) return;
      
      if (!resourceMap[group.resource]) {
        resourceMap[group.resource] = {
          resource: group.resource,
          display_name: group.display_name,
          permissions: []
        };
      }
      
      resourceMap[group.resource].permissions.push(...filteredPermissions);
    });
    
    return Object.values(resourceMap);
  };

  const getActionPermission = (resourcePermissions: any[], action: string) => {
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

  const organizedPermissions = useMemo(() => getOrganizedPermissions(), [permissions]);
  
  // استخراج permissions از API به صورت داینامیک
  const analyticsUsedPermissions = useMemo(() => {
    return getAnalyticsPermissions(permissions || []);
  }, [permissions]);
  
  const aiUsedPermissions = useMemo(() => {
    return getAIPermissions(permissions || []);
  }, [permissions]);
  
  // تشخیص منابع Standalone (is_standalone: True)
  const isStandaloneResource = (resource: any) => {
    const perms = resource.permissions || [];
    return perms.some((p: any) => p.is_standalone === true);
  };

  // تشخیص منابع Admin-only (requires_superadmin: True)
  const isAdminOnlyResource = (resource: any) => {
    const perms = resource.permissions || [];
    // اگر همه permissions نیاز به superadmin داشته باشند، admin-only است
    if (perms.length === 0) return false;
    return perms.every((p: any) => p.requires_superadmin === true);
  };

  // منابع Standalone (settings, forms, chatbot, panel, pages)
  // توجه: analytics و ai جداگانه نمایش داده می‌شوند
  const standaloneResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => {
      // حذف analytics و ai (جداگانه نمایش داده می‌شوند)
      if (r.resource === 'analytics' || r.resource?.startsWith('analytics.')) {
        return false;
      }
      if (r.resource === 'ai' || r.resource?.startsWith('ai.')) {
        return false;
      }
      // فقط resources با is_standalone: true
      return isStandaloneResource(r);
    });
  }, [organizedPermissions]);

  // منابع Analytics
  const analyticsResources = useMemo(() => {
    const filtered = organizedPermissions.filter((r: any) => {
      // بررسی: resource name می‌تواند 'analytics' یا 'analytics.stats' و غیره باشد
      return r.resource === 'analytics' || r.resource?.startsWith('analytics.');
    });
    
    // اگر چند resource analytics داریم، همه را در یک resource merge کنیم
    if (filtered.length > 1) {
      // حذف permissions تکراری بر اساس id
      const permissionMap = new Map<number, any>();
      filtered.forEach((r: any) => {
        r.permissions?.forEach((perm: any) => {
          if (perm.id && !permissionMap.has(perm.id)) {
            permissionMap.set(perm.id, perm);
          }
        });
      });
      
      const mergedResource = {
        resource: 'analytics',
        display_name: filtered[0]?.display_name || 'Analytics',
        permissions: Array.from(permissionMap.values())
      };
      return [mergedResource];
    }
    
    return filtered;
  }, [organizedPermissions]);

  // منابع AI
  const aiResources = useMemo(() => {
    const filtered = organizedPermissions.filter((r: any) => {
      // بررسی: resource name می‌تواند 'ai' یا 'ai.chat' و غیره باشد
      return r.resource === 'ai' || r.resource?.startsWith('ai.');
    });
    
    // اگر چند resource ai داریم، همه را در یک resource merge کنیم
    if (filtered.length > 1) {
      // حذف permissions تکراری بر اساس id
      const permissionMap = new Map<number, any>();
      filtered.forEach((r: any) => {
        r.permissions?.forEach((perm: any) => {
          if (perm.id && !permissionMap.has(perm.id)) {
            permissionMap.set(perm.id, perm);
          }
        });
      });
      
      const mergedResource = {
        resource: 'ai',
        display_name: filtered[0]?.display_name || 'AI Tools',
        permissions: Array.from(permissionMap.values())
      };
      return [mergedResource];
    }
    
    return filtered;
  }, [organizedPermissions]);

  // منابع Standard (محتوا و داده - CRUD)
  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => {
      // حذف analytics و ai (جداگانه نمایش داده می‌شوند)
      if (r.resource === 'analytics' || r.resource?.startsWith('analytics.')) {
        return false;
      }
      if (r.resource === 'ai' || r.resource?.startsWith('ai.')) {
        return false;
      }
      // حذف standalone و admin-only
      if (isStandaloneResource(r)) {
        return false;
      }
      if (isAdminOnlyResource(r)) {
        return false;
      }
      return true;
    });
  }, [organizedPermissions]);

  const logicalPermissionErrors = useMemo(() => {
    const errors: string[] = [];
    
    standardResources.forEach((resource: any) => {
      const viewPerm = getActionPermission(resource.permissions, 'view');
      
      if (!viewPerm) return;
      
      const hasView = isPermissionSelected(viewPerm.id);
      
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

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6 pb-28 relative">

      <div className="space-y-6">
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
              <div className="space-y-8">
                <div className="space-y-4 border p-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
                <div className="space-y-4 border p-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
                <div className="space-y-4 border p-4">
                  <Skeleton className="h-6 w-36" />
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ) : permissionsError ? (
              <div className="text-center text-destructive py-8">
                <p>خطا در بارگیری دسترسی‌ها</p>
                <p className="text-sm mt-2">{String(permissionsError)}</p>
              </div>
            ) : permissions && permissions.length > 0 ? (
              <div className="space-y-8">
                
                {/* بخش 1: مجوزهای محتوا و داده (CRUD) - اول نمایش داده می‌شود */}
                <PermissionWarningAlert
                  logicalPermissionErrors={logicalPermissionErrors}
                  standardResources={standardResources}
                  getResourceIcon={getResourceIcon}
                />

                {standardResources.length > 0 && (
                  <Card className="border-2 border-dashed border-green-500/20 bg-green-500/5">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10">
                          <ShieldCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle>
                            مجوزهای محتوا و داده
                          </CardTitle>
                          <p className="text-sm text-font-s mt-1">
                            دسترسی‌های جزئی برای مدیریت محتوا (مشاهده، ایجاد، ویرایش، حذف)
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <StandardPermissionsTable
                        resources={standardResources}
                        selectedPermissions={selectedPermissions}
                        isSuperAdmin={isSuperAdmin}
                        logicalPermissionErrors={logicalPermissionErrors}
                        onTogglePermission={togglePermission}
                        onToggleAllResourcePermissions={toggleAllResourcePermissions}
                        onToggleAllStandardPermissions={(checked, permissionIds) => {
                          const newSelected = checked
                            ? [...selectedPermissions, ...permissionIds.filter(id => !selectedPermissions.includes(id))]
                            : selectedPermissions.filter(id => !permissionIds.includes(id));
                          setSelectedPermissions(newSelected);
                          setValue("permission_ids", newSelected, { shouldValidate: true });
                        }}
                        isPermissionSelected={isPermissionSelected}
                        areAllResourcePermissionsSelected={areAllResourcePermissionsSelected}
                        getActionPermission={getActionPermission}
                        getResourceIcon={getResourceIcon}
                        allPermissions={permissions?.flatMap((g: any) => g.permissions) || []}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* بخش 2: دسترسی‌های کلیدی سیستم (Standalone) */}
                {analyticsResources.length > 0 && analyticsResources[0]?.permissions?.length > 0 && (
                  <StatisticsPermissionsCard
                    permissions={analyticsResources[0].permissions}
                    selectedPermissions={selectedPermissions}
                    isSuperAdmin={isSuperAdmin}
                    statisticsUsedPermissions={analyticsUsedPermissions}
                    onTogglePermission={togglePermission}
                    onToggleAllStatistics={(checked, statsPermIds) => {
                      const newSelected = checked
                        ? [...selectedPermissions, ...statsPermIds.filter((id: number) => !selectedPermissions.includes(id))]
                        : selectedPermissions.filter((id: number) => !statsPermIds.includes(id));
                      setSelectedPermissions(newSelected);
                      setValue("permission_ids", newSelected, { shouldValidate: true });
                    }}
                    isPermissionSelected={isPermissionSelected}
                    getResourceIcon={getResourceIcon}
                  />
                )}

                {aiResources.length > 0 && aiResources[0]?.permissions?.length > 0 && (
                  <AIPermissionsCard
                    permissions={aiResources[0].permissions}
                    selectedPermissions={selectedPermissions}
                    isSuperAdmin={isSuperAdmin}
                    aiUsedPermissions={aiUsedPermissions}
                    onTogglePermission={togglePermission}
                    onToggleAllAI={(checked, aiPermIds) => {
                      const newSelected = checked
                        ? [...selectedPermissions, ...aiPermIds.filter((id: number) => !selectedPermissions.includes(id))]
                        : selectedPermissions.filter((id: number) => !aiPermIds.includes(id));
                      setSelectedPermissions(newSelected);
                      setValue("permission_ids", newSelected, { shouldValidate: true });
                    }}
                    isPermissionSelected={isPermissionSelected}
                    getResourceIcon={getResourceIcon}
                    allPermissions={permissions?.flatMap((g: any) => g.permissions) || []}
                  />
                )}

                {standaloneResources.length > 0 && (
                  <ManagementPermissionsCard
                    resources={standaloneResources}
                    selectedPermissions={selectedPermissions}
                    isSuperAdmin={isSuperAdmin}
                    onTogglePermission={togglePermission}
                    isPermissionSelected={isPermissionSelected}
                    getResourceIcon={getResourceIcon}
                  />
                )}

                
                {selectedPermissions.length > 0 && (
                  <div className="p-3 bg-bg/50">
                    <div className="text-sm font-medium">
                      دسترسی‌های انتخاب شده: {selectedPermissions.length}
                    </div>
                  </div>
                )}
                
                {errors.permission_ids?.message && (
                  <div className="flex items-start gap-2 text-sm text-destructive mt-4 p-3 bg-destructive/10">
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

        <Suspense fallback={<RoleBasicInfoFormSkeleton />}>
          <RoleBasicInfoForm
            form={form}
            onSubmit={onSubmit}
            isSubmitting={createRoleMutation.isPending}
            submitButtonText="ایجاد"
            hideSubmitButton={true}
          />
        </Suspense>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button 
          onClick={handleFormSubmit} 
          size="lg"
          disabled={createRoleMutation.isPending}
        >
          {createRoleMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد نقش
            </>
          )}
        </Button>
      </div>
    </div>
  );
}