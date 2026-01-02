import { useMemo } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useRole, useBasePermissions, usePermissions, usePermissionMap } from "@/core/permissions";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { 
  ArrowLeft, 
  Edit, 
  Shield, 
  ShieldCheck, 
  Calendar,
  Key,
  CheckCircle2,
  Info,
  Sparkles
} from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { getPermissionTranslation } from "@/core/messages/permissions";

export default function RoleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);

  const { data: role, isLoading, error } = useRole(roleId);
  const { data: basePermissions } = useBasePermissions();
  const { data: permissions } = usePermissions();
  const { data: permissionMap } = usePermissionMap();
  
  const actualBasePermissions = basePermissions && Array.isArray(basePermissions) && basePermissions.length > 0
    ? basePermissions
    : (permissionMap?.base || []);

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
        <PageHeader title="اطلاعات نقش">
          <>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
            <Button disabled>
              <Edit className="h-4 w-4" />
              ویرایش نقش
            </Button>
          </>
        </PageHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft />
            بازگشت
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-1">نقش مورد نظر یافت نشد</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            بازگشت به لیست
          </Button>
        </div>
      </div>
    );
  }

  const basePermsCount = actualBasePermissions && Array.isArray(actualBasePermissions) ? actualBasePermissions.length : 0;
  const specificPermsCount = role.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions) 
    ? role.permissions.specific_permissions.length 
    : 0;
  const totalPermsCount = basePermsCount + specificPermsCount;
  const isProtected = (role as any).is_protected || false;

  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص";
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const translateBasePermission = (basePerm: any): string => {
    const permissionKey = typeof basePerm === 'string' 
      ? basePerm 
      : (basePerm.permission_key || basePerm.key || 
         (basePerm.module && basePerm.action ? `${basePerm.module}.${basePerm.action}` : ''));
    
    if (permissionKey) {
      const directTranslation = getPermissionTranslation(permissionKey, "description");
      if (directTranslation && directTranslation !== permissionKey) {
        return directTranslation;
      }
    }
    
    if (typeof basePerm === 'object' && basePerm.display_name) {
      const displayTranslation = getPermissionTranslation(basePerm.display_name, "description");
      if (displayTranslation && displayTranslation !== basePerm.display_name) {
        return displayTranslation;
      }
    }
    
    const parts = permissionKey.split('.');
    if (parts.length >= 2) {
      const module = parts[0];
      const action = parts[1];
      const moduleTranslated = getPermissionTranslation(module, "resource");
      const actionTranslated = getPermissionTranslation(action, "action");
      return `${actionTranslated} ${moduleTranslated}`;
    }
    
    return permissionKey || 'نامشخص';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات نقش">
        <>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            بازگشت
          </Button>
          <Link to={`/roles/${roleId}/edit`}>
            <Button>
              <Edit className="h-4 w-4" />
              ویرایش نقش
            </Button>
          </Link>
        </>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <CardWithIcon
            icon={Info}
            title="اطلاعات نقش"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            borderColor="border-b-indigo-1"
            className="sticky top-20"
          >
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-6 px-4 rounded-lg border border-br bg-bg/50">
                <div className={`relative p-4 rounded-xl mb-4 ${
                  isProtected 
                    ? "bg-gradient-to-br from-blue-1 to-indigo-1" 
                    : "bg-gradient-to-br from-gray-1 to-gray-2"
                }`}>
                  {isProtected ? (
                    <ShieldCheck className="h-8 w-8 text-white" />
                  ) : (
                    <Shield className="h-8 w-8 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-font-p mb-2 text-center">{role.name}</h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge 
                    variant={role.is_active ? "green" : "gray"} 
                    className="text-xs"
                  >
                    {role.is_active ? "فعال" : "غیرفعال"}
                  </Badge>
                  <Badge 
                    variant={isProtected ? "blue" : "outline"} 
                    className="text-xs"
                  >
                    {isProtected ? "سیستمی" : "سفارشی"}
                  </Badge>
                </div>
              </div>

              {role.description && (
                <div className="p-4 rounded-lg border border-br bg-bg/50">
                  <label className="text-xs font-semibold text-font-s mb-2 block">توضیحات</label>
                  <p className="text-sm text-font-s leading-relaxed">{role.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center py-4 px-3 rounded-lg border border-br bg-blue-0/30">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full mb-2 bg-blue">
                    <Key className="w-4 h-4 text-blue-2" />
                  </div>
                  <span className="text-lg font-bold text-font-p">{basePermsCount}</span>
                  <span className="text-xs text-font-s text-center">پایه</span>
                </div>
                <div className="flex flex-col items-center justify-center py-4 px-3 rounded-lg border border-br bg-purple-0/30">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full mb-2 bg-purple">
                    <Sparkles className="w-4 h-4 text-purple-2" />
                  </div>
                  <span className="text-lg font-bold text-font-p">{specificPermsCount}</span>
                  <span className="text-xs text-font-s text-center">اختصاصی</span>
                </div>
                <div className="flex flex-col items-center justify-center py-4 px-3 rounded-lg border border-br bg-green-0/30">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full mb-2 bg-green">
                    <CheckCircle2 className="w-4 h-4 text-green-2" />
                  </div>
                  <span className="text-lg font-bold text-font-p">{totalPermsCount}</span>
                  <span className="text-xs text-font-s text-center">کل</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-br bg-bg/50">
                  <div className="p-2 rounded-lg bg-blue-0">
                    <Calendar className="h-4 w-4 text-blue-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-font-s block mb-1">تاریخ ایجاد</label>
                    <p className="text-sm font-medium text-font-p">{formatDate(role.created_at)}</p>
                  </div>
                </div>

                {role.updated_at && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-br bg-bg/50">
                    <div className="p-2 rounded-lg bg-purple-0">
                      <Calendar className="h-4 w-4 text-purple-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-semibold text-font-s block mb-1">آخرین به‌روزرسانی</label>
                      <p className="text-sm font-medium text-font-p">{formatDate(role.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardWithIcon>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <CardWithIcon
            icon={Key}
            title="دسترسی‌های پایه"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            titleExtra={
              <Badge variant="blue" className="text-xs">
                {basePermsCount} دسترسی
              </Badge>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-font-s leading-relaxed p-3 rounded-lg bg-blue-0/30 border border-blue-1/20">
                این دسترسی‌ها به صورت پیش‌فرض به همه ادمین‌ها تعلق دارد و قابل تغییر نیست.
              </p>
              <div className="flex flex-wrap gap-2">
                {actualBasePermissions && Array.isArray(actualBasePermissions) && actualBasePermissions.length > 0 ? (
                  actualBasePermissions.map((basePerm: any, index: number) => {
                    const key = typeof basePerm === 'string' 
                      ? basePerm 
                      : (basePerm.id || basePerm.key || basePerm.permission_key || index);
                    const translated = translateBasePermission(basePerm);
                    
                    return (
                      <Badge 
                        key={key} 
                        variant="blue"
                        className="text-xs"
                      >
                        {translated}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-sm text-font-s">هیچ دسترسی پایه‌ای یافت نشد</p>
                )}
              </div>
            </div>
          </CardWithIcon>

          <CardWithIcon
            icon={Sparkles}
            title="دسترسی‌های اختصاصی این نقش"
            iconBgColor="bg-purple"
            iconColor="stroke-purple-2"
            borderColor="border-b-purple-1"
            titleExtra={
              specificPermsCount > 0 ? (
                <Badge variant="purple" className="text-xs">
                  {specificPermsCount} دسترسی
                </Badge>
              ) : null
            }
          >
            {(() => {
              if (role.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions) && role.permissions.specific_permissions.length > 0) {
                const specificPerms = role.permissions.specific_permissions;
                
                    const matchedPermissions = specificPerms.map((perm: any) => {
                      const permKey = perm.permission_key || `${perm.module}.${perm.action}`;
                      const moduleActionKey = `${perm.module}.${perm.action}`;
                      
                      let displayName = permissionDisplayNames[permKey] || 
                                       permissionDisplayNames[moduleActionKey] ||
                                       permissionDisplayNames[perm.permission_key || ''];
                      
                      const finalDisplayName = displayName || `${perm.module}.${perm.action}`;
                      
                      return {
                        key: permKey,
                        displayName: finalDisplayName,
                        module: perm.module,
                        action: perm.action,
                        originalKey: perm.permission_key,
                      };
                    });
                    
                    const translatePermission = (perm: typeof matchedPermissions[0]) => {
                      if (perm.originalKey) {
                        const keyTranslated = getPermissionTranslation(perm.originalKey, "description");
                        if (keyTranslated !== perm.originalKey) return keyTranslated;
                      }
                      
                      if (perm.displayName) {
                        const descTranslated = getPermissionTranslation(perm.displayName, "description");
                        if (descTranslated !== perm.displayName) return descTranslated;
                        
                        const resourceTranslated = getPermissionTranslation(perm.displayName, "resource");
                        if (resourceTranslated !== perm.displayName) return resourceTranslated;
                      }
                      
                      const moduleTranslated = getPermissionTranslation(perm.module, "resource");
                      const actionTranslated = getPermissionTranslation(perm.action, "action");
                      
                      if (moduleTranslated !== perm.module && actionTranslated !== perm.action) {
                        return `${actionTranslated} ${moduleTranslated}`;
                      }
                      
                      return perm.displayName;
                    };
                    
                    return (
                      <div className="space-y-4">
                        <p className="text-sm text-font-s leading-relaxed p-3 rounded-lg bg-purple-0/30 border border-purple-1/20">
                          دسترسی‌های اختصاصی که فقط به این نقش تعلق دارد.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matchedPermissions.map((perm, index) => {
                            const finalText = translatePermission(perm);
                            
                            return (
                              <Badge 
                                key={index} 
                                variant="purple"
                                className="text-xs"
                              >
                                {finalText}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
              }
              
              return (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-0 border-2 border-purple-1 mb-4">
                    <Shield className="h-8 w-8 text-purple-1" />
                  </div>
                  <p className="text-font-p font-semibold mb-2">فقط دسترسی‌های پایه</p>
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
