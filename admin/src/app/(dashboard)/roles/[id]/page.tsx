"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRole, useBasePermissions, usePermissions } from "@/core/permissions/hooks/useRoles";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { Separator } from "@/components/elements/Separator";
import { 
  ArrowLeft, 
  Edit, 
  Shield, 
  ShieldCheck, 
  Users, 
  Calendar,
  Key,
  CheckCircle2,
  Info,
  Sparkles
} from "lucide-react";
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
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

  // Count permissions for display
  const basePermsCount = basePermissions && Array.isArray(basePermissions) ? basePermissions.length : 0;
  const specificPermsCount = role.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions) 
    ? role.permissions.specific_permissions.length 
    : 0;
  const totalPermsCount = basePermsCount + specificPermsCount;

  return (
    <div className="space-y-8">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-0 via-purple-0 to-blue-0 p-8 shadow-lg">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className={`relative p-4 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 ${
                (role as any).is_protected 
                  ? "bg-gradient-to-br from-blue-1 to-indigo-1" 
                  : "bg-gradient-to-br from-gray-1 to-gray-2"
              }`}>
                {(role as any).is_protected ? (
                  <ShieldCheck className="h-8 w-8 text-white" />
                ) : (
                  <Shield className="h-8 w-8 text-white" />
                )}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-1 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-font-p mb-2">{role.name}</h1>
                {role.description && (
                  <p className="text-font-s text-sm max-w-2xl leading-relaxed">{role.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Badge 
                variant={role.is_active ? "green" : "gray"} 
                className="text-sm px-3 py-1.5 font-medium shadow-sm"
              >
                {role.is_active ? "✓ فعال" : "✗ غیرفعال"}
              </Badge>
              <Badge 
                variant={(role as any).is_protected ? "blue" : "outline"} 
                className="text-sm px-3 py-1.5 font-medium shadow-sm"
              >
                {(role as any).is_protected ? "🛡️ سیستمی" : "✨ سفارشی"}
              </Badge>
              <Badge variant="indigo" className="text-sm px-3 py-1.5 font-medium shadow-sm">
                🔑 {totalPermsCount} دسترسی
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
            <Link href={`/roles/${roleId}/edit`}>
              <Button className="bg-gradient-to-r from-indigo-1 to-purple-1 hover:from-indigo-2 hover:to-purple-2 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Edit className="h-4 w-4" />
                ویرایش نقش
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards with Creative Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-0 to-emerald-0 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-b-4 border-b-green-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-1/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green shadow-lg">
                <ShieldCheck className="h-6 w-6 text-green-2" />
              </div>
              <Badge variant="green" className="text-xs font-bold px-2.5 py-1">
                {role.is_active ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-font-p mb-1">وضعیت نقش</h3>
            <p className="text-sm text-font-s">نوع: {(role as any).is_protected ? "سیستمی" : "سفارشی"}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-0 to-cyan-0 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-b-4 border-b-blue-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-1/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue shadow-lg">
                <Key className="h-6 w-6 text-blue-2" />
              </div>
              <Badge variant="blue" className="text-xs font-bold px-2.5 py-1">
                {basePermsCount} مورد
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-font-p mb-1">دسترسی‌های پایه</h3>
            <p className="text-sm text-font-s">برای همه ادمین‌ها</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-0 to-pink-0 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-b-4 border-b-purple-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-1/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple shadow-lg">
                <Sparkles className="h-6 w-6 text-purple-2" />
              </div>
              <Badge variant="purple" className="text-xs font-bold px-2.5 py-1">
                {specificPermsCount} مورد
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-font-p mb-1">دسترسی‌های اختصاصی</h3>
            <p className="text-sm text-font-s">مختص این نقش</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role Information - Left Column */}
        <div className="lg:col-span-1">
          <CardWithIcon
            icon={Info}
            title="اطلاعات نقش"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            borderColor="border-b-indigo-1"
            className="sticky top-20"
          >
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-0 to-purple-0 border border-indigo-1/20">
                <label className="text-xs font-bold text-font-s uppercase tracking-wider mb-2 block">نام نقش</label>
                <p className="text-xl font-bold text-font-p">{role.name}</p>
              </div>
              
              {role.description && (
                <div className="p-4 rounded-xl bg-bg/50 border border-br">
                  <label className="text-xs font-bold text-font-s uppercase tracking-wider mb-2 block">توضیحات</label>
                  <p className="text-sm text-font-s leading-relaxed">{role.description}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-0/50 to-cyan-0/50 border border-blue-1/20 hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 rounded-lg bg-blue shadow-sm group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5 text-blue-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-bold text-font-s uppercase tracking-wider block mb-1">تاریخ ایجاد</label>
                    <p className="text-sm font-semibold text-font-p">
                      {new Date(role.created_at).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {role.updated_at && (
                  <div className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-0/50 to-pink-0/50 border border-purple-1/20 hover:shadow-md transition-all duration-300">
                    <div className="p-2.5 rounded-lg bg-purple shadow-sm group-hover:scale-110 transition-transform">
                      <Calendar className="h-5 w-5 text-purple-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-bold text-font-s uppercase tracking-wider block mb-1">آخرین به‌روزرسانی</label>
                      <p className="text-sm font-semibold text-font-p">
                        {new Date(role.updated_at).toLocaleDateString('fa-IR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardWithIcon>
        </div>

        {/* Permissions - Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Base Permissions */}
          <CardWithIcon
            icon={CheckCircle2}
            title="دسترسی‌های پایه"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            titleExtra={
              <Badge variant="blue" className="text-xs font-bold px-3 py-1 shadow-sm">
                {basePermsCount} دسترسی
              </Badge>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-font-s leading-relaxed p-3 rounded-lg bg-blue-0/30 border border-blue-1/20">
                ✨ این دسترسی‌ها به صورت پیش‌فرض به همه ادمین‌ها تعلق دارد و قابل تغییر نیست.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {basePermissions && Array.isArray(basePermissions) && basePermissions.length > 0 ? (
                  basePermissions.map((basePerm: any) => (
                    <Badge 
                      key={basePerm.id} 
                      variant="blue"
                      className="text-xs font-medium px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                      {getPermissionTranslation(basePerm.display_name, "description") || basePerm.display_name}
                    </Badge>
                  ))
                ) : (
                  // Fallback اگر API در دسترس نباشد
                  <>
                    <Badge variant="blue" className="text-xs font-medium px-3 py-1.5 shadow-sm">مشاهده Dashboard</Badge>
                    <Badge variant="blue" className="text-xs font-medium px-3 py-1.5 shadow-sm">مشاهده Media</Badge>
                    <Badge variant="blue" className="text-xs font-medium px-3 py-1.5 shadow-sm">ویرایش پروفایل شخصی</Badge>
                    <Badge variant="blue" className="text-xs font-medium px-3 py-1.5 shadow-sm">مشاهده اطلاعات شخصی</Badge>
                  </>
                )}
              </div>
            </div>
          </CardWithIcon>

          {/* Role-specific Permissions */}
          <CardWithIcon
            icon={Sparkles}
            title="دسترسی‌های اختصاصی این نقش"
            iconBgColor="bg-purple"
            iconColor="stroke-purple-2"
            borderColor="border-b-purple-1"
            titleExtra={
              specificPermsCount > 0 ? (
                <Badge variant="purple" className="text-xs font-bold px-3 py-1 shadow-sm">
                  {specificPermsCount} دسترسی
                </Badge>
              ) : null
            }
          >
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
                    <p className="text-sm text-font-s leading-relaxed p-3 rounded-lg bg-purple-0/30 border border-purple-1/20">
                      🎯 دسترسی‌های اختصاصی که فقط به این نقش تعلق دارد.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {matchedPermissions.map((perm, index) => {
                        // Try to translate using description type (like in form components)
                        const translated = getPermissionTranslation(perm.displayName, "description");
                        // If translation found, use it; otherwise try resource type; otherwise use original
                        const finalText = translated || getPermissionTranslation(perm.displayName, "resource") || perm.displayName;
                        
                        return (
                          <Badge 
                            key={index} 
                            variant="purple"
                            className="text-xs font-medium px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                          >
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
                    <p className="text-sm text-font-s">
                      دسترسی‌های اختصاصی که فقط به این نقش تعلق دارد.
                    </p>
                    
                    {/* Modules */}
                    {role.permissions.modules && Array.isArray(role.permissions.modules) && role.permissions.modules.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2 text-font-p">ماژول‌ها</h5>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.modules.map((module: string, index: number) => (
                            <Badge key={index} variant="purple">
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
                        <h5 className="font-medium text-sm mb-2 text-font-p">عملیات</h5>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.actions.map((action: string, index: number) => (
                            <Badge key={index} variant="purple">
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
                        <h5 className="font-medium text-sm mb-2 text-font-p">دسترسی‌های ویژه</h5>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.special.map((special: string, index: number) => (
                            <Badge key={index} variant="purple">
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
                        <h5 className="font-medium text-sm mb-2 text-font-p">محدودیت‌ها</h5>
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
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-0 to-pink-0 border-4 border-purple-1 mb-6 shadow-lg">
                    <Shield className="h-10 w-10 text-purple-2" />
                  </div>
                  <p className="text-font-p font-semibold text-lg mb-2">فقط دسترسی‌های پایه</p>
                  <p className="text-sm text-font-s">این نقش هیچ دسترسی اختصاصی ندارد</p>
                </div>
              );
            })()}
          </CardWithIcon>
        </div>
      </div>
    </div>
  );
} 