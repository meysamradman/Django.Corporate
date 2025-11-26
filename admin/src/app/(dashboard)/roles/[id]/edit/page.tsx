"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRole, useUpdateRole, usePermissions, useBasePermissions } from "@/core/permissions/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  ArrowLeft,
  Save,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { getPermissionTranslation, PERMISSION_TRANSLATIONS } from "@/core/messages/permissions";
import { extractFieldErrors, hasFieldErrors, showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
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

const roleSchema = z.object({
  name: z.string().min(2, "نام نقش باید حداقل 2 کاراکتر باشد"),
  description: z.string().optional(),
  permission_ids: z.array(z.number()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

// getResourceIcon is now imported from utils

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  const resolvedParams = React.use(params);
  const roleId = parseInt(resolvedParams.id);
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
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
  } = form;

  // Set form data when role is loaded
  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || "",
      });
    }
  }, [role, reset]);

  // Set selected permissions based on role's current permissions + base permissions
  useEffect(() => {
    if (role && permissions) {
      const basePermissionIds = getBasePermissionIds(permissions);
      const rolePermissionIds: number[] = [];
      
      // ✅ FIX: Reset selectedPermissions first to avoid stale state
      // Check for specific_permissions format (new format)
      if (role.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions)) {
        const specificPerms = role.permissions.specific_permissions;
        
        // Match each specific permission to its ID
        permissions.forEach(group => {
          group.permissions.forEach(permission => {
            // Skip base permissions
            if (basePermissionIds.includes(permission.id)) {
              return;
            }
            
            // ✅ FIX: Improved matching logic
            const hasPermission = specificPerms.some((perm: any) => {
              const permOriginalKey = (permission as any).original_key;
              
              // ✅ FIX: Always use permission_key (original_key) if available for exact match
              // This ensures we match the exact permission, not just module+action
              if (permOriginalKey && perm.permission_key) {
                return perm.permission_key === permOriginalKey;
              }
              
              // ✅ FIX: For statistics permissions, use permission_key for exact match
              if (permission.resource === 'statistics' && permOriginalKey) {
                return perm.permission_key === permOriginalKey;
              }
              
              // ✅ FIX: For management permissions (is_standalone), use original_key for exact match
              // Management permissions all have action='manage', so we need original_key to distinguish them
              if (permission.is_standalone && permOriginalKey) {
                return perm.permission_key === permOriginalKey;
              }
              
              // For other permissions, use module + action matching
              const permModule = (perm.module || perm.resource || '').toLowerCase();
              const permissionResource = (permission.resource || '').toLowerCase();
              const permResourceMatch = permModule === permissionResource;
              
              // Normalize both actions to lowercase for comparison
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
        // Fallback: old modules/actions format
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
      
      // ✅ FIX: Combine and dedup, ensuring valid numbers
      // Only include base permissions and matched role permissions
      const uniqueIds = Array.from(new Set([...basePermissionIds, ...rolePermissionIds]))
        .filter(id => typeof id === 'number' && !isNaN(id));
      
      // ✅ FIX: Set permissions only if they're different to avoid unnecessary re-renders
      setSelectedPermissions(prev => {
        const prevSet = new Set(prev);
        const newSet = new Set(uniqueIds);
        
        // Check if sets are different
        if (prevSet.size !== newSet.size || 
            !Array.from(prevSet).every(id => newSet.has(id))) {
          return uniqueIds;
        }
        return prev;
      });
    }
  }, [role, permissions, basePermissions]);
  
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

  // Group permissions by resource and organize actions
  const getOrganizedPermissions = () => {
    if (!permissions) return [];
    
    // Get base permission IDs to exclude them from the form
    const basePermissionIds = getBasePermissionIds(permissions);
    
    // Create a map of resources and their permissions
    const resourceMap: Record<string, any> = {};
    
    permissions.forEach(group => {
      // Filter out base permissions (dashboard.read, profile.read, profile.update)
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

  // ✅ FIX: Memoize organizedPermissions to prevent re-computation
  const organizedPermissions = useMemo(() => getOrganizedPermissions(), [permissions]);
  
  // Check if resource should be in management section
  const isManagementResource = (resource: any) => {
    const name = resource.resource?.toLowerCase() || '';
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

  // Backward compatibility (optional)
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

  const onSubmit = async (data: RoleFormData) => {
    try {
      // ✅ FIX: Get base permission IDs to exclude them from submission
      const basePermissionIds = getBasePermissionIds(permissions || []);
      
      // ✅ FIX: Filter out base permissions from selectedPermissions
      // Base permissions are automatically granted to all admins and should not be sent
      const userSelectedPermissions = selectedPermissions.filter(
        id => !basePermissionIds.includes(id)
      );
      
      // Convert permission IDs to modules/actions format that backend expects
      const selectedPermsData: Array<{module: string; action: string; permission_key?: string}> = [];
      
      if (permissions) {
        permissions.forEach((group: any) => {
          group.permissions.forEach((perm: any) => {
            // ✅ FIX: Only include permissions that are selected AND not base permissions
            if (userSelectedPermissions.includes(perm.id)) {
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

      await updateRoleMutation.mutateAsync({
        id: roleId,
        data: payload,
      });
      
      // ✅ FIX: Toast is already shown in useUpdateRole hook, no need to show again
      // showSuccessToast(msg.ui("success")); // Removed to avoid duplicate toast
      
      // ✅ FIX: Wait for backend cache to clear and role to refetch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ FIX: Refetch role to get updated permissions
      // This ensures the form shows the correct permissions after save
      // Note: useUpdateRole already invalidates and refetches, but we wait a bit more
      
      router.push("/roles");
    } catch (error: any) {
      console.error("Role update error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as any, {
            type: 'server',
            message: message as string
          });
        });
        showErrorToast(error, "لطفاً خطاهای فرم را بررسی کنید");
      } else {
        showErrorToast(error);
      }
    }
  };

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4" />
            بازگشت
          </Button>
          <div>
            <div className="h-8 w-48 bg-bg animate-pulse rounded" />
            <div className="h-4 w-32 bg-bg animate-pulse rounded mt-2" />
          </div>
        </div>
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft />
            بازگشت
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-font-s">داده‌ای یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          ویرایش نقش: {role.name}
        </h1>
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
              <div className="text-center text-red-1 py-8">
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
                  />
                )}

                {/* Management-Only Modules */}
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
          isSubmitting={updateRoleMutation.isPending}
        />
      </div>
    </div>
  );
}