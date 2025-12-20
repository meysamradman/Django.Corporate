import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useCreateRole, usePermissions, useBasePermissions, useUserPermissions } from "@/components/admins/permissions";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Skeleton } from "@/components/elements/Skeleton";
import {
  AlertCircle,
  ShieldCheck,
  Loader2,
  Save,
  List,
} from "lucide-react";
import { Button } from "@/components/elements/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleFormSchema, roleFormDefaults, type RoleFormValues } from "@/components/roles/validations/roleSchema";
import { extractFieldErrors, hasFieldErrors, showError } from '@/core/toast';
import { getResourceIcon } from "@/components/roles/form/utils";

const PermissionsSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4 rounded-lg border p-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
    <div className="space-y-4 rounded-lg border p-4">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  </div>
);

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
  () => import("@/components/roles/form").then(mod => ({ default: mod.RoleBasicInfoForm }))
);

const ANALYTICS_USED_PERMISSIONS: readonly string[] = [
  'analytics.manage',  // Website visit analytics (page views)
  'analytics.stats.manage',  // Full access to all app statistics
  'analytics.users.read',
  'analytics.admins.read',
  'analytics.content.read',
  'analytics.tickets.read',
  'analytics.emails.read',
  'analytics.system.read',
  'analytics.dashboard.read'
];

const AI_USED_PERMISSIONS: readonly string[] = [
  'ai.manage',
  'ai.chat.manage',
  'ai.content.manage',
  'ai.image.manage',
  'ai.audio.manage',
  'ai.settings.personal.manage'
];

export default function CreateRolePage() {
  const navigate = useNavigate();

  const createRoleMutation = useCreateRole();
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const { data: basePermissions } = useBasePermissions();
  const { isSuperAdmin } = useUserPermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema) as any,
    defaultValues: roleFormDefaults as any,
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
      
      if ((toggledPerm as any)?.original_key === 'ai.manage') {
        if (isCurrentlySelected) {
          newPermissions = prev.filter(id => id !== permissionId);
        } else {
          const aiPermissionIds = allPermissions
            .filter((p: any) => (p as any).original_key?.startsWith('ai.') && (p as any).original_key !== 'ai.manage')
            .map((p: any) => p.id);
          newPermissions = [...prev.filter(id => !aiPermissionIds.includes(id)), permissionId];
        }
      } else if ((toggledPerm as any)?.original_key?.startsWith('ai.')) {
        const aiManagePerm = allPermissions.find((p: any) => (p as any).original_key === 'ai.manage');
        const isAiManageSelected = aiManagePerm && prev.includes((aiManagePerm as any).id);
        
        if (isAiManageSelected) {
          return prev;
        }
        
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      } else {
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

  const isManagementResource = (resource: any) => {
    const perms = resource.permissions || [];

    const hasStandalonePermission = perms.some((p: any) => p.is_standalone);
    if (hasStandalonePermission) {
      return true;
    }
    
    const standardActions = ['create', 'post', 'write', 'add', 
                             'edit', 'update', 'put', 'patch', 'modify', 
                             'delete', 'remove', 'destroy', 'read', 'export', 'manage'];
    
    const hasStandardAction = perms.some((p: any) => {
      const action = p.action?.toLowerCase() || '';
      return standardActions.includes(action);
    });
    
    return !hasStandardAction;
  };

  const organizedPermissions = useMemo(() => getOrganizedPermissions(), [permissions]);

  const manageOnlyResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => isManagementResource(r));
  }, [organizedPermissions]);

  const analyticsResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => r.resource === 'analytics');
  }, [organizedPermissions]);

  const aiResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => r.resource === 'ai');
  }, [organizedPermissions]);

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => !isManagementResource(r) && r.resource !== 'analytics' && r.resource !== 'ai');
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
      <PageHeader title="ایجاد نقش جدید">
        <Button 
          variant="outline"
          onClick={() => navigate("/roles")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </PageHeader>

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
                <div className="space-y-4 rounded-lg border p-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
                <div className="space-y-4 rounded-lg border p-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
                <div className="space-y-4 rounded-lg border p-4">
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
                <Suspense fallback={null}>
                  <PermissionWarningAlert
                    logicalPermissionErrors={logicalPermissionErrors}
                    standardResources={standardResources}
                    getResourceIcon={getResourceIcon}
                  />
                </Suspense>

                <Suspense fallback={<PermissionsSkeleton />}>
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
                  />
                </Suspense>

                {analyticsResources.length > 0 && analyticsResources[0]?.permissions?.length > 0 && (
                  <Suspense fallback={<PermissionsSkeleton />}>
                    <StatisticsPermissionsCard
                      permissions={analyticsResources[0].permissions}
                      selectedPermissions={selectedPermissions}
                      isSuperAdmin={isSuperAdmin}
                      statisticsUsedPermissions={ANALYTICS_USED_PERMISSIONS}
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
                  </Suspense>
                )}

                {aiResources.length > 0 && aiResources[0]?.permissions?.length > 0 && (
                  <Suspense fallback={<PermissionsSkeleton />}>
                    <AIPermissionsCard
                      permissions={aiResources[0].permissions}
                      selectedPermissions={selectedPermissions}
                      isSuperAdmin={isSuperAdmin}
                      aiUsedPermissions={AI_USED_PERMISSIONS}
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
                  </Suspense>
                )}

                <Suspense fallback={<PermissionsSkeleton />}>
                  <ManagementPermissionsCard
                    resources={manageOnlyResources}
                    selectedPermissions={selectedPermissions}
                    isSuperAdmin={isSuperAdmin}
                    onTogglePermission={togglePermission}
                    isPermissionSelected={isPermissionSelected}
                    getResourceIcon={getResourceIcon}
                  />
                </Suspense>
                
                {selectedPermissions.length > 0 && (
                  <div className="p-3 bg-bg/50 rounded-lg">
                    <div className="text-sm font-medium">
                      دسترسی‌های انتخاب شده: {selectedPermissions.length}
                    </div>
                  </div>
                )}
                
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

        <Suspense fallback={<RoleBasicInfoFormSkeleton />}>
          <RoleBasicInfoForm
            form={form as any}
            onSubmit={onSubmit as any}
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