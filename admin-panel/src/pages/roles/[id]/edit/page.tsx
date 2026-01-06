import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRole, useUpdateRole, usePermissions, useBasePermissions } from "@/core/permissions";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  Save,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { extractFieldErrors, hasFieldErrors, showError } from '@/core/toast';
import { useUserPermissions } from "@/core/permissions";
import {
  StandardPermissionsTable,
  PermissionWarningAlert,
  StatisticsPermissionsCard,
  AIPermissionsCard,
  ManagementPermissionsCard,
  RoleBasicInfoForm,
} from "@/components/roles/form";
import { getResourceIcon } from "@/components/roles/form/utils";

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

const roleSchema = z.object({
  name: z.string().min(2, "نام نقش باید حداقل 2 کاراکتر باشد"),
  description: z.string().optional(),
  permission_ids: z.array(z.number()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function EditRolePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const roleId = parseInt(id || '0');
  const updateRoleMutation = useUpdateRole();
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const { data: basePermissions } = useBasePermissions();
  const { isSuperAdmin } = useUserPermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
  } = form;

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || "",
      });
    }
  }, [role, reset]);

  useEffect(() => {
    if (role && permissions) {
      const basePermissionIds = getBasePermissionIds(permissions);
      const rolePermissionIds: number[] = [];
      
      if (role.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions)) {
        const specificPerms = role.permissions.specific_permissions;
        
        permissions.forEach(group => {
          group.permissions.forEach(permission => {
            if (basePermissionIds.includes(permission.id)) {
              return;
            }
            
            const hasPermission = specificPerms.some((perm: any) => {
              const permOriginalKey = (permission as any).original_key;
              
              if (permOriginalKey && perm.permission_key) {
                return perm.permission_key === permOriginalKey;
              }
              
              if (permission.resource === 'analytics' && permOriginalKey) {
                return perm.permission_key === permOriginalKey;
              }
              
              if (permission.is_standalone && permOriginalKey) {
                return perm.permission_key === permOriginalKey;
              }
              
              const permModule = (perm.module || perm.resource || '').toLowerCase();
              const permissionResource = (permission.resource || '').toLowerCase();
              const permResourceMatch = permModule === permissionResource;
              
              const backendAction = (perm.action || '').toLowerCase();
              const frontendAction = (permission.action || '').toLowerCase();
              const permActionMatch = backendAction === frontendAction;
              
              return permResourceMatch && permActionMatch;
            });
            
            if (hasPermission) {
              rolePermissionIds.push(permission.id);
            }
          });
        });
      } else {
        const roleModules = role.permissions?.modules || [];
        const roleActions = role.permissions?.actions || [];
        
        if (roleModules.length === 0 && roleActions.length === 0) {
          setSelectedPermissions([...basePermissionIds]);
          return;
        }
        
        permissions.forEach(group => {
          group.permissions.forEach(permission => {
            if (basePermissionIds.includes(permission.id)) {
              return;
            }
            
            const hasModule = roleModules.includes('all') || roleModules.includes(permission.resource);
            const hasAction = roleActions.includes('all') || roleActions.includes(permission.action?.toLowerCase());
            
            if (hasModule && hasAction) {
              rolePermissionIds.push(permission.id);
            }
          });
        });
      }
      
      const uniqueIds = Array.from(new Set([...basePermissionIds, ...rolePermissionIds]))
        .filter(id => typeof id === 'number' && !isNaN(id));
      
      setSelectedPermissions(prev => {
        const prevSet = new Set(prev);
        const newSet = new Set(uniqueIds);
        
        if (prevSet.size !== newSet.size || 
            !Array.from(prevSet).every(id => newSet.has(id))) {
          return uniqueIds;
        }
        return prev;
      });
    }
  }, [role, permissions, basePermissions]);
  
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

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      const allPermissions = permissions?.flatMap(g => g.permissions) || [];
      const toggledPerm = allPermissions.find((p: any) => p.id === permissionId);
      const isCurrentlySelected = prev.includes(permissionId);
      
      let newPermissions: number[];
      const originalKey = (toggledPerm as any)?.original_key || '';
      const resource = (toggledPerm as any)?.resource || '';
      const action = (toggledPerm as any)?.action || '';
      
      const permKey = originalKey || `${resource}.${action}`;
      
      if (permKey === 'admin.manage' || (resource === 'admin' && action?.toLowerCase() === 'manage')) {
        if (isCurrentlySelected) {
          newPermissions = prev.filter(id => id !== permissionId);
        } else {
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
      else if ((permKey.startsWith('admin.') && permKey !== 'admin.manage') || 
               (resource === 'admin' && action?.toLowerCase() !== 'manage')) {
        const adminManagePerm = allPermissions.find((p: any) => {
          const pKey = (p as any).original_key || `${(p as any).resource || ''}.${(p as any).action || ''}`;
          return pKey === 'admin.manage' || ((p as any).resource === 'admin' && (p as any).action?.toLowerCase() === 'manage');
        });
        const isAdminManageSelected = adminManagePerm && prev.includes(adminManagePerm.id);
        
        if (isAdminManageSelected) {
          return prev; // اگر admin.manage فعال است، اجازه انتخاب permissions جزئی را نده
        }
        
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      }
      else if (permKey === 'analytics.manage' || permKey === 'analytics.stats.manage') {
        if (isCurrentlySelected) {
          newPermissions = prev.filter(id => id !== permissionId);
        } else {
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
      else if ((permKey.startsWith('analytics.') && permKey !== 'analytics.manage' && permKey !== 'analytics.stats.manage') ||
               (resource === 'analytics' && action?.toLowerCase() !== 'manage')) {
        const analyticsManagePerm = allPermissions.find((p: any) => {
          const pKey = (p as any).original_key || `${(p as any).resource || ''}.${(p as any).action || ''}`;
          return pKey === 'analytics.manage' || pKey === 'analytics.stats.manage' ||
                 ((p as any).resource === 'analytics' && (p as any).action?.toLowerCase() === 'manage');
        });
        const isAnalyticsManageSelected = analyticsManagePerm && prev.includes(analyticsManagePerm.id);
        
        if (isAnalyticsManageSelected) {
          return prev; // اگر analytics.manage فعال است، اجازه انتخاب permissions جزئی را نده
        }
        
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      }
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
      else if (originalKey.startsWith('ai.')) {
        const aiManagePerm = allPermissions.find((p: any) => (p as any).original_key === 'ai.manage');
        const isAiManageSelected = aiManagePerm && prev.includes(aiManagePerm.id);
        
        if (isAiManageSelected) {
          return prev;
        }
        
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      } 
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
  
  const analyticsUsedPermissions = useMemo(() => {
    return getAnalyticsPermissions(permissions || []);
  }, [permissions]);
  
  const aiUsedPermissions = useMemo(() => {
    return getAIPermissions(permissions || []);
  }, [permissions]);
  
  const isStandaloneResource = (resource: any) => {
    const perms = resource.permissions || [];
    return perms.some((p: any) => p.is_standalone === true);
  };

  const isAdminOnlyResource = (resource: any) => {
    const perms = resource.permissions || [];
    if (perms.length === 0) return false;
    return perms.every((p: any) => p.requires_superadmin === true);
  };

  const standaloneResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => {
      // حذف analytics و ai (جداگانه نمایش داده می‌شوند)
      if (r.resource === 'analytics' || r.resource?.startsWith('analytics.')) {
        return false;
      }
      if (r.resource === 'ai' || r.resource?.startsWith('ai.')) {
        return false;
      }
      return isStandaloneResource(r);
    });
  }, [organizedPermissions]);

  const analyticsResources = useMemo(() => {
    const filtered = organizedPermissions.filter((r: any) => {
      // بررسی: resource name می‌تواند 'analytics' یا 'analytics.stats' و غیره باشد
      return r.resource === 'analytics' || r.resource?.startsWith('analytics.');
    });
    
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

  const aiResources = useMemo(() => {
    const filtered = organizedPermissions.filter((r: any) => {
      return r.resource === 'ai' || r.resource?.startsWith('ai.');
    });
    
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

  const adminOnlyResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => {
      if (r.resource === 'admin' && isAdminOnlyResource(r)) {
        return true;
      }
      return false;
    });
  }, [organizedPermissions]);

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => {
      if (r.resource === 'analytics' || r.resource?.startsWith('analytics.')) {
        return false;
      }
      if (r.resource === 'ai' || r.resource?.startsWith('ai.')) {
        return false;
      }
      if (isStandaloneResource(r)) {
        return false;
      }
      if (isAdminOnlyResource(r)) {
        return false;
      }
      return true;
    });
  }, [organizedPermissions]);

  const allDisplayedResources = useMemo(() => {
    const displayed = [
      ...standaloneResources,
      ...analyticsResources,
      ...aiResources,
      ...adminOnlyResources,
      ...standardResources
    ];
    return displayed;
  }, [standaloneResources, analyticsResources, aiResources, adminOnlyResources, standardResources]);

  useEffect(() => {
    if (organizedPermissions.length > 0) {
      const displayedResourceNames = new Set(allDisplayedResources.map((r: any) => r.resource));
      const allResourceNames = new Set(organizedPermissions.map((r: any) => r.resource));
      
      const missing = Array.from(allResourceNames).filter(name => !displayedResourceNames.has(name));
      
      if (missing.length > 0) {
      }
    }
  }, [organizedPermissions, allDisplayedResources]);


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

  const onSubmit = async (data: RoleFormData) => {
    try {
      const basePermissionIds = getBasePermissionIds(permissions || []);
      
      const userSelectedPermissions = selectedPermissions.filter(
        id => !basePermissionIds.includes(id)
      );
      
      const selectedPermsData: Array<{module: string; action: string; permission_key?: string}> = [];
      
      if (permissions) {
        permissions.forEach((group: any) => {
          group.permissions.forEach((perm: any) => {
            if (userSelectedPermissions.includes(perm.id)) {
              if ((perm as any).original_key) {
                selectedPermsData.push({
                  module: perm.resource,
                  action: perm.action.toLowerCase(),
                  permission_key: (perm as any).original_key
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

      await updateRoleMutation.mutateAsync({
        id: roleId,
        data: payload,
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate("/roles");
    } catch (error: any) {
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as any, {
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

  if (roleLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
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
      <div className="text-center py-8">
        <p className="text-font-s">داده‌ای یافت نشد</p>
      </div>
    );
  }

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
                        allPermissions={permissions?.flatMap((g: any) => g.permissions) || []}
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

        <RoleBasicInfoForm
          form={form}
          onSubmit={onSubmit}
          isSubmitting={updateRoleMutation.isPending}
          submitButtonText="ذخیره"
          hideSubmitButton={true}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button 
          onClick={handleFormSubmit} 
          size="lg"
          disabled={updateRoleMutation.isPending}
        >
          {updateRoleMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ذخیره تغییرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}