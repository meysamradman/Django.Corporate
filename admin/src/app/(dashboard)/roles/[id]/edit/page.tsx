"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRole, useUpdateRole, usePermissions, useBasePermissions } from "@/core/permissions/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Checkbox } from "@/components/elements/Checkbox";
import { Badge } from "@/components/elements/Badge";
import {
  ArrowLeft,
  Save,
  Loader2,
  Shield,
  Users,
  Image,
  FileText,
  Settings,
  BarChart3,
  ShieldCheck,
  LayoutPanelLeft,
  BookOpenText,
  FolderTree,
  Tags,
  Component,
  Tag,
  ListTree,
  ListChecks,
  PieChart,
  Sparkles,
  Mail,
  SquarePen,
  BookOpenCheck
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/elements/Table";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { extractFieldErrors, hasFieldErrors, showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";

const roleSchema = z.object({
  name: z.string().min(2, "نام نقش باید حداقل 2 کاراکتر باشد"),
  description: z.string().optional(),
  permission_ids: z.array(z.number()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

// Get icon based on resource name
const getResourceIcon = (resourceKey: string) => {
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
    
    return resourceIconMap[resourceKey] || <Shield className="h-4 w-4" />;
};

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  const resolvedParams = React.use(params);
  const roleId = parseInt(resolvedParams.id);
  const updateRoleMutation = useUpdateRole();
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const { data: basePermissions } = useBasePermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

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
      
      console.log("=== LOADING ROLE PERMISSIONS ===");
      console.log("Role permissions:", role.permissions);
      console.log("Base permission IDs:", basePermissionIds);
      
      // Check for specific_permissions format (new format)
      if (role.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions)) {
        const specificPerms = role.permissions.specific_permissions;
        console.log("Specific permissions from backend:", specificPerms);
        
        // Match each specific permission to its ID
        permissions.forEach(group => {
          group.permissions.forEach(permission => {
            if (basePermissionIds.includes(permission.id)) {
              return;
            }
            
            const hasPermission = specificPerms.some((perm: any) => {
              const permModule = perm.module || perm.resource;
              const permResourceMatch = permModule === permission.resource;
              
              // Normalize both actions to lowercase for comparison
              const backendAction = (perm.action || '').toLowerCase();
              const frontendAction = (permission.action || '').toLowerCase();
              const permActionMatch = backendAction === frontendAction;
              
              // Debug for manage permissions
              if (backendAction === 'manage' || frontendAction === 'manage') {
                console.log("Checking manage:", {
                  backend: { module: permModule, action: backendAction },
                  frontend: { resource: permission.resource, action: frontendAction },
                  resourceMatch: permResourceMatch,
                  actionMatch: permActionMatch,
                  result: permResourceMatch && permActionMatch
                });
              }
              
              return permResourceMatch && permActionMatch;
            });
            
            if (hasPermission) {
              console.log("✅ Matched permission ID:", permission.id, permission);
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
      
      // Combine and dedup, ensuring valid numbers
      const uniqueIds = Array.from(new Set([...basePermissionIds, ...rolePermissionIds]))
        .filter(id => typeof id === 'number' && !isNaN(id));
      
      console.log("Final selected permission IDs:", uniqueIds);
      console.log("=== END LOADING ===");
      
      setSelectedPermissions(uniqueIds);
    }
  }, [role, permissions]);
  
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
    console.log("Toggling permission ID:", permissionId); // Log ID being toggled
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const toggleAllResourcePermissions = (resourcePermissions: any[]) => {
    // Get all permission IDs for this resource
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    
    // Check if all permissions for this resource are currently selected
    const allSelected = resourcePermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Deselect all permissions for this resource
      setSelectedPermissions(prev => prev.filter(id => !resourcePermissionIds.includes(id)));
    } else {
      // Select all permissions for this resource
      setSelectedPermissions(prev => {
        const newSelected = [...prev];
        resourcePermissionIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
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

  // ✅ FIX: Memoize organizedPermissions to prevent re-computation
  const organizedPermissions = useMemo(() => getOrganizedPermissions(), [permissions]);
  
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

  // Logic Update: Separating based on explicit list AND action types
  const manageOnlyResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => isManagementResource(r));
  }, [organizedPermissions]);

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((r: any) => !isManagementResource(r));
  }, [organizedPermissions]);

  // Backward compatibility (optional)
  const hasManageOnlyResources = manageOnlyResources.length > 0;

  const onSubmit = async (data: RoleFormData) => {
    try {
      // Sanitize permissions: remove null/undefined and ensure they are numbers
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

      await updateRoleMutation.mutateAsync({
        id: roleId,
        data: payload,
      });
      
      showSuccessToast(msg.ui("success"));
      
      // Wait for backend cache to clear
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        <Card>
          <CardHeader>
            <CardTitle>دسترسی‌ها</CardTitle>
            <p className="text-sm text-font-s">
              دسترسی‌های مورد نیاز برای این نقش را انتخاب کنید
            </p>
          </CardHeader>
          <CardContent>
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
                {/* Standard Resources Table */}
                {standardResources.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            onCheckedChange={(checked) => {
                              if (checked) {
                                  // Select all standard permissions
                                  const permissionIds = standardResources.flatMap(
                                  (resource: any) => resource.permissions.map((p: any) => p.id)
                                );
                                  const newSelected = [...selectedPermissions, ...permissionIds.filter(id => !selectedPermissions.includes(id))];
                                  setSelectedPermissions(newSelected);
                              } else {
                                  // Deselect all standard permissions
                                  const permissionIds = standardResources.flatMap(
                                    (resource: any) => resource.permissions.map((p: any) => p.id)
                                  );
                                  setSelectedPermissions(selectedPermissions.filter(id => !permissionIds.includes(id)));
                              }
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
                )}

                {/* Management-Only Modules */}
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
                                {getResourceIcon(resource.display_name)}
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
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">
                      دسترسی‌های انتخاب شده: {selectedPermissions.length}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-font-s py-8">
                دسترسی‌ای موجود نیست
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایه</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">نام *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="نام نقش را وارد کنید"
                  className={errors.name ? "border-red-1" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-1 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="توضیحات نقش را وارد کنید"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={updateRoleMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateRoleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  بروزرسانی
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateRoleMutation.isPending}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}