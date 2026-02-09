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
import { Switch } from "@/components/elements/Switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleFormSchema, roleFormDefaults, type RoleFormValues } from "@/components/roles/validations/roleSchema";
import { extractFieldErrors, hasFieldErrors, showError } from '@/core/toast';
import { getResourceIcon } from "@/components/roles/form/utils";
import { getPermissionTranslation } from "@/core/messages/permissions";

const RoleBasicInfoFormSkeleton = () => (
  <CardWithIcon
    icon={ShieldCheck}
    title="اطلاعات پایه"
    iconBgColor="bg-blue"
    iconColor="stroke-blue-2"
    cardBorderColor="border-b-blue-1"
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
      const resource = (toggledPerm as any)?.resource || '';
      const action = (toggledPerm as any)?.action || '';

      const isManageAction = action?.toLowerCase() === 'manage';

      if (isManageAction) {
        if (isCurrentlySelected) {
          newPermissions = prev.filter(id => id !== permissionId);
        } else {
          newPermissions = [...prev, permissionId];
        }
      } else {
        const parentManagePerm = allPermissions.find((p: any) =>
          p.resource === resource && p.action?.toLowerCase() === 'manage'
        );
        const isParentManageSelected = parentManagePerm && prev.includes(parentManagePerm.id);

        if (isParentManageSelected) {
          return prev; // Parent manage is active, so child is implicitly active and can't be toggled.
        }

        newPermissions = isCurrentlySelected
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      }

      const isOpAction = ['create', 'edit', 'delete', 'update', 'post', 'patch', 'destroy', 'remove'].includes(action.toLowerCase());
      const isViewAction = ['view', 'read', 'get', 'list'].includes(action.toLowerCase());

      if (isOpAction && !isCurrentlySelected) {
        const viewPerm = allPermissions.find((p: any) =>
          p.resource === resource && ['view', 'read'].includes(p.action.toLowerCase())
        );
        if (viewPerm && !newPermissions.includes(viewPerm.id)) {
          newPermissions.push(viewPerm.id);
        }
      } else if (isViewAction && isCurrentlySelected) {
        const opPermIds = allPermissions
          .filter((p: any) =>
            p.resource === resource &&
            ['create', 'edit', 'delete', 'update', 'post', 'put', 'patch', 'destroy', 'remove'].includes(p.action.toLowerCase())
          )
          .map((p: any) => p.id);
        newPermissions = newPermissions.filter(id => !opPermIds.includes(id));
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
      const selectedPermsData: Array<{ module: string; action: string; permission_key?: string }> = [];

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

  const hasContentMasterToggle = (resource: any) => {
    const perms = resource.permissions || [];
    return perms.some((p: any) =>
      p.is_standalone === true &&
      p.action?.toLowerCase() === 'manage' &&
      p.permission_category === 'content_master'
    );
  };

  const isAdminOnlyResource = (resource: any) => {
    const perms = resource.permissions || [];
    if (perms.length === 0) return false;
    return perms.every((p: any) => p.requires_superadmin === true);
  };

  const standaloneResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => {
      if (r.resource === 'analytics' || r.resource?.startsWith('analytics.')) {
        return false;
      }
      if (r.resource === 'ai' || r.resource?.startsWith('ai.')) {
        return false;
      }
      if (hasContentMasterToggle(r)) {
        return false;
      }
      return isStandaloneResource(r);
    });
  }, [organizedPermissions]);

  const analyticsResources = useMemo(() => {
    const filtered = organizedPermissions.filter((r: any) => {
      return r.resource === 'analytics' || r.resource?.startsWith('analytics.');
    });

    if (filtered.length > 1) {
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

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => {
      if (r.resource === 'analytics' || r.resource?.startsWith('analytics.')) {
        return false;
      }
      if (r.resource === 'ai' || r.resource?.startsWith('ai.')) {
        return false;
      }
      if (hasContentMasterToggle(r)) {
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
          cardBorderColor="border-b-blue-1"
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
                  <CardContent className="space-y-8">
                    {(() => {
                      const moduleMasterPerms = permissions
                        ?.flatMap((g: any) => g.permissions)
                        .filter((p: any) =>
                          p.is_standalone === true &&
                          p.action?.toLowerCase() === 'manage' &&
                          p.permission_category === 'content_master'
                        );

                      if (!moduleMasterPerms || moduleMasterPerms.length === 0) return null;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 border-b border-dashed border-green-500/20">
                          {moduleMasterPerms.map((perm: any) => (
                            <div
                              key={perm.id}
                              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${isPermissionSelected(perm.id)
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-card border-br hover:border-green-500/20"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isPermissionSelected(perm.id) ? "bg-green-500/20" : "bg-bg"}`}>
                                  {getResourceIcon(perm.resource)}
                                </div>
                                <div>
                                  <h4 className={`text-sm font-semibold ${isPermissionSelected(perm.id) ? "text-green-700" : "text-font-p"}`}>
                                    {getPermissionTranslation(perm.display_name, "resource")}
                                  </h4>
                                  <p className="text-xs text-font-s">دسترسی کامل و یکپارچه</p>
                                </div>
                              </div>
                              <Switch
                                checked={isPermissionSelected(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <StandardPermissionsTable
                      resources={standardResources}
                      selectedPermissions={selectedPermissions}
                      isSuperAdmin={isSuperAdmin}
                      logicalPermissionErrors={[]}
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