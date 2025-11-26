"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRole, useBasePermissions, usePermissions } from "@/core/permissions/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Separator } from "@/components/elements/Separator";
import { ArrowLeft, Edit, Shield, ShieldCheck, Users, Calendar } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import Link from "next/link";
import { getPermissionTranslation } from "@/core/messages/permissions";

export default function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const roleId = Number(resolvedParams.id);

  const { data: role, isLoading, error } = useRole(roleId);
  const { data: basePermissions } = useBasePermissions();
  const { data: permissions } = usePermissions();

  // Match permissions with display names from API
  const permissionDisplayNames = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return {} as Record<string, string>;
    
    const displayMap: Record<string, string> = {};
    
    permissions.forEach((group: any) => {
      group.permissions?.forEach((perm: any) => {
        const permKey = perm.original_key || `${perm.resource}.${perm.action}`;
        displayMap[permKey] = perm.display_name;
      });
    });
    
    return displayMap;
  }, [permissions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft />
            بازگشت
          </Button>
        </div>
                           <div className="space-y-4">
                     <div className="flex items-center gap-4">
                       <Skeleton className="h-8 w-24" />
                       <Skeleton className="h-8 w-48" />
                     </div>
                     <div className="grid gap-6 md:grid-cols-2">
                       <div className="space-y-4">
                         <Skeleton className="h-6 w-32" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-3/4" />
                       </div>
                       <div className="space-y-4">
                         <Skeleton className="h-6 w-32" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-2/3" />
                       </div>
                     </div>
                   </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft />
            بازگشت
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-1">نقش مورد نظر یافت نشد</p>
          <Button onClick={() => router.back()} className="mt-4">
            بازگشت به لیست
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">{role.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(role as any).is_protected ? (
                <ShieldCheck className="h-5 w-5 text-blue-1" />
              ) : (
                <Shield className="h-5 w-5 text-gray-1" />
              )}
              اطلاعات نقش
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-font-s">نام نقش</label>
              <p className="text-lg font-semibold">{role.name}</p>
            </div>
            
            {role.description && (
              <div>
                <label className="text-sm font-medium text-font-s">توضیحات</label>
                <p className="text-sm">{role.description}</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium text-font-s">وضعیت</label>
                <div className="mt-1">
                  {role.is_active ? (
                    <Badge variant="default">فعال</Badge>
                  ) : (
                    <Badge variant="outline">غیرفعال</Badge>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-font-s">نوع</label>
                <div className="mt-1">
                  {(role as any).is_protected ? (
                    <Badge variant="default">سیستمی</Badge>
                  ) : (
                    <Badge variant="outline">سفارشی</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-font-s" />
              <div>
                <label className="text-sm font-medium text-font-s">تاریخ ایجاد</label>
                <p className="text-sm">
                  {new Date(role.created_at).toLocaleDateString('en-US')}
                </p>
              </div>
            </div>

            {role.updated_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-font-s" />
                <div>
                  <label className="text-sm font-medium text-font-s">آخرین به‌روزرسانی</label>
                  <p className="text-sm">
                    {new Date(role.updated_at).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              دسترسی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Base Permissions - همیشه نمایش داده می‌شود */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm mb-3 text-blue-1">🟢 دسترسی‌های پایه (همه ادمین‌ها):</h4>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {basePermissions && Array.isArray(basePermissions) && basePermissions.length > 0 ? (
                    basePermissions.map((basePerm: any) => (
                      <Badge key={basePerm.id} variant="default">
                        {basePerm.display_name}
                      </Badge>
                    ))
                  ) : (
                    // Fallback اگر API در دسترس نباشد
                    <>
                      <Badge variant="default">مشاهده Dashboard</Badge>
                      <Badge variant="default">مشاهده Media</Badge>
                      <Badge variant="default">ویرایش پروفایل شخصی</Badge>
                      <Badge variant="default">مشاهده اطلاعات شخصی</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Role-specific Permissions */}
            {(() => {
              // ✅ NEW: Support specific_permissions format (new format)
              if (role.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions) && role.permissions.specific_permissions.length > 0) {
                const specificPerms = role.permissions.specific_permissions;
                
                const matchedPermissions = specificPerms.map((perm: any) => {
                  // Try multiple key formats to find the display name
                  const permKey = perm.permission_key || `${perm.module}.${perm.action}`;
                  const moduleActionKey = `${perm.module}.${perm.action}`;
                  
                  // Try to find display_name using different key formats
                  let displayName = permissionDisplayNames[permKey] || 
                                   permissionDisplayNames[moduleActionKey] ||
                                   permissionDisplayNames[perm.permission_key || ''];
                  
                  // If we found display_name from API, use it; otherwise construct a readable name
                  const finalDisplayName = displayName || `${perm.module}.${perm.action}`;
                  
                  return {
                    key: permKey,
                    displayName: finalDisplayName,
                    module: perm.module,
                    action: perm.action,
                    originalKey: perm.permission_key,
                  };
                });
                
                return (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm mb-3 text-green-1">🎯 دسترسی‌های اختصاصی این نقش:</h4>
                    <div className="flex flex-wrap gap-2">
                      {matchedPermissions.map((perm, index) => {
                        // Try to translate using description type (like in form components)
                        const translated = getPermissionTranslation(perm.displayName, "description");
                        // If translation found, use it; otherwise try resource type; otherwise use original
                        const finalText = translated || getPermissionTranslation(perm.displayName, "resource") || perm.displayName;
                        
                        return (
                          <Badge key={index} variant="outline">
                            {finalText}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              
              // ✅ OLD FORMAT: modules/actions (backward compatibility)
              if (role.permissions && Object.keys(role.permissions).length > 0) {
                return (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm mb-3 text-green-1">🎯 دسترسی‌های اختصاصی این نقش:</h4>
                    
                    {/* Modules */}
                    {role.permissions.modules && Array.isArray(role.permissions.modules) && role.permissions.modules.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">ماژول‌ها:</h5>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.modules.map((module: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {module === 'all' ? 'همه ماژول‌ها' : 
                               module === 'users' ? 'کاربران' :
                               module === 'media' ? 'رسانه' :
                               module === 'portfolio' ? 'نمونه کار' :
                               module === 'blog' ? 'بلاگ' :
                               module === 'categories' ? 'دسته‌بندی' :
                               module === 'analytics' ? 'آمار' : module}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    {role.permissions.actions && Array.isArray(role.permissions.actions) && role.permissions.actions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">عملیات:</h5>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.actions.map((action: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {action === 'all' ? 'همه عملیات' :
                               action === 'create' ? 'ایجاد' :
                               action === 'read' ? 'مشاهده' :
                               action === 'update' ? 'ویرایش' :
                               action === 'delete' ? 'حذف' :
                               action === 'export' ? 'خروجی' : action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Special Permissions */}
                    {role.permissions.special && Array.isArray(role.permissions.special) && role.permissions.special.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">دسترسی‌های ویژه:</h5>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.special.map((special: string, index: number) => (
                            <Badge key={index} variant="default">
                              {special === 'user_management' ? 'مدیریت کاربران' :
                               special === 'system_settings' ? 'تنظیمات سیستم' : special}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Restrictions */}
                    {role.permissions.restrictions && Array.isArray(role.permissions.restrictions) && role.permissions.restrictions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">محدودیت‌ها:</h5>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.restrictions.map((restriction: string, index: number) => (
                            <Badge key={index} variant="red">
                              {restriction === 'no_user_management' ? 'بدون مدیریت کاربران' :
                               restriction === 'no_admin_users' ? 'بدون دسترسی ادمین‌ها' :
                               restriction === 'no_delete' ? 'بدون حذف' :
                               restriction === 'read_only' ? 'فقط خواندنی' :
                               restriction === 'limited_fields' ? 'فیلدهای محدود' :
                               restriction === 'no_sensitive_data' ? 'بدون داده حساس' : restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <div className="text-center py-4 text-font-s">
                  <p>فقط دسترسی‌های پایه تخصیص داده شده است</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 