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
import { roleFormSchema, roleFormDefaults, RoleFormValues } from "@/core/validations/roleSchema";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { extractFieldErrors, hasFieldErrors, showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";
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

// ✅ OPTIMIZED: Statistics permissions that are actually used (defined once, reused)
// ترتیب مهمه: در RTL از راست به چپ نمایش داده میشه (معکوس آرایه)
const STATISTICS_USED_PERMISSIONS: readonly string[] = [
  'statistics.manage', // دسترسی کامل اول (سمت راست)
  'statistics.users.read',
  'statistics.admins.read',
  'statistics.content.read'
];

// ✅ AI permissions that are actually used (defined once, reused)
// ترتیب مهمه: در RTL از راست به چپ نمایش داده میشه (معکوس آرایه)
const AI_USED_PERMISSIONS: readonly string[] = [
  'ai.manage', // دسترسی کامل اول (سمت راست)
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
      // Find the permission being toggled
      const allPermissions = permissions?.flatMap((g: any) => g.permissions) || [];
      const toggledPerm = allPermissions.find((p: any) => p.id === permissionId);
      const isCurrentlySelected = prev.includes(permissionId);
      
      let newPermissions: number[];
      
      if ((toggledPerm as any)?.original_key === 'ai.manage') {
        // ✅ If toggling ai.manage
        if (isCurrentlySelected) {
          // Unselecting ai.manage - just remove it
          newPermissions = prev.filter(id => id !== permissionId);
        } else {
          // Selecting ai.manage - remove all other AI permissions first
          const aiPermissionIds = allPermissions
            .filter((p: any) => (p as any).original_key?.startsWith('ai.') && (p as any).original_key !== 'ai.manage')
            .map((p: any) => p.id);
          newPermissions = [...prev.filter(id => !aiPermissionIds.includes(id)), permissionId];
        }
      } else if ((toggledPerm as any)?.original_key?.startsWith('ai.')) {
        // ✅ If toggling any other AI permission
        const aiManagePerm = allPermissions.find((p: any) => (p as any).original_key === 'ai.manage');
        const isAiManageSelected = aiManagePerm && prev.includes((aiManagePerm as any).id);
        
        if (isAiManageSelected) {
          // ai.manage is selected - don't allow toggling other AI permissions
          return prev;
        }
        
        // Normal toggle for other AI permissions
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      } else {
        // Normal toggle for non-AI permissions
        newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
      }
      
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

  // getResourceIcon is now imported from utils

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
    // Only these have is_standalone=True for management: panel, pages, forms, settings, chatbot
    const hasStandalonePermission = perms.some((p: any) => p.is_standalone);
    if (hasStandalonePermission) {
      return true;
    }
    
    // 2. For others, check if they lack standard CRUD actions
    // Statistics has CRUD permissions (read, export, manage) so should NOT be in management section
    const standardActions = ['create', 'post', 'write', 'add', 
                             'edit', 'update', 'put', 'patch', 'modify', 
                             'delete', 'remove', 'destroy', 'read', 'export', 'manage'];
    
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

  // Separate statistics and AI from standard resources
  const statisticsResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => r.resource === 'statistics');
  }, [organizedPermissions]);

  const aiResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => r.resource === 'ai');
  }, [organizedPermissions]);

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => !isManagementResource(r) && r.resource !== 'statistics' && r.resource !== 'ai');
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

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6 pb-28 relative">
      {/* Header */}
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
                <PermissionWarningAlert
                  logicalPermissionErrors={logicalPermissionErrors}
                  standardResources={standardResources}
                  getResourceIcon={getResourceIcon}
                />

                {/* Standard Resources Table */}
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

                {/* Statistics Permissions - Separate Card */}
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

                {/* AI Permissions - Separate Card */}
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
                    allPermissions={permissions?.flatMap((g: any) => g.permissions) || []} // ✅ Pass all permissions for media check
                  />
                )}

                {/* Management-Only Modules (Settings, Analytics, etc.) */}
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
        <RoleBasicInfoForm
          form={form}
          onSubmit={onSubmit}
          isSubmitting={createRoleMutation.isPending}
          submitButtonText="ایجاد"
          hideSubmitButton={true}
        />
      </div>

      {/* Sticky Save Buttons Footer */}
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