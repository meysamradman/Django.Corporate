"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCreateRole, usePermissions, useBasePermissions } from "@/core/permissions/hooks/useRoles";
import { Card, CardContent, CardHeader } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
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
import { getPermissionTranslation, PERMISSION_TRANSLATIONS } from "@/core/messages/permissions";
import { roleFormSchema, roleFormDefaults, RoleFormValues } from "@/components/roles/validations/roleSchema";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { extractFieldErrors, hasFieldErrors, showSuccess, showError } from '@/core/toast';
import { msg } from '@/core/messages';
import { useUserPermissions } from "@/core/permissions/hooks/useUserPermissions";
import {
  StandardPermissionsTable,
  PermissionWarningAlert,
  StatisticsPermissionsCard,
  AIPermissionsCard,
  ManagementPermissionsCard,
  RoleBasicInfoForm,
} from "@/components/roles/form";
import { getResourceIcon } from "@/components/roles/form/utils";

const STATISTICS_USED_PERMISSIONS: readonly string[] = [
  'statistics.manage',
  'statistics.users.read',
  'statistics.admins.read',
  'statistics.content.read'
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
  const router = useRouter();

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
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
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

      const result = await createRoleMutation.mutateAsync(payload);
      
      router.push("/roles");
    } catch (error: any) {

      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as any, {
            type: 'server',
            message: message as string
          });
        });
        
        showError(error, "لطفاً خطاهای فرم را بررسی کنید");
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

  const statisticsResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => r.resource === 'statistics');
  }, [organizedPermissions]);

  const aiResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => r.resource === 'ai');
  }, [organizedPermissions]);

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => !isManagementResource(r) && r.resource !== 'statistics' && r.resource !== 'ai');
  }, [organizedPermissions]);

  const hasManageOnlyResources = manageOnlyResources.length > 0;

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
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد نقش جدید</h1>
        <Button 
          variant="outline"
          onClick={() => router.push("/roles")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </div>

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
              <div className="text-center text-destructive py-8">
                <p>خطا در بارگیری دسترسی‌ها</p>
                <p className="text-sm mt-2">{String(permissionsError)}</p>
              </div>
            ) : permissions && permissions.length > 0 ? (
              <div className="space-y-8">
                
                <PermissionWarningAlert
                  logicalPermissionErrors={logicalPermissionErrors}
                  standardResources={standardResources}
                  getResourceIcon={getResourceIcon}
                />

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

                {statisticsResources.length > 0 && statisticsResources[0]?.permissions?.length > 0 && (
                  <StatisticsPermissionsCard
                    permissions={statisticsResources[0].permissions}
                    selectedPermissions={selectedPermissions}
                    isSuperAdmin={isSuperAdmin}
                    statisticsUsedPermissions={STATISTICS_USED_PERMISSIONS}
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
                )}

                <ManagementPermissionsCard
                  resources={manageOnlyResources}
                  selectedPermissions={selectedPermissions}
                  isSuperAdmin={isSuperAdmin}
                  onTogglePermission={togglePermission}
                  isPermissionSelected={isPermissionSelected}
                  getResourceIcon={getResourceIcon}
                />
                
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

        <RoleBasicInfoForm
          form={form}
          onSubmit={onSubmit}
          isSubmitting={createRoleMutation.isPending}
          submitButtonText="ایجاد"
          hideSubmitButton={true}
        />
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