import { useNavigate, useParams } from "react-router-dom";
import { FloatingActions } from "@/components/elements/FloatingActions";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import {
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
import { useRoleDetailViewState } from "@/components/roles/hooks/useRoleDetailViewState";

export default function RoleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);

  const {
    role,
    isLoading,
    error,
    actualBasePermissions,
    basePermsCount,
    specificPermsCount,
    totalPermsCount,
    isProtected,
    formatDate,
    translateBasePermission,
    specificPermissionBadges,
  } = useRoleDetailViewState(roleId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="text-center py-8">
        <p className="text-red-1">نقش مورد نظر یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <FloatingActions
        actions={[
          {
            icon: Edit,
            label: "ویرایش نقش",
            variant: "default",
            permission: "admin.update",
            onClick: () => navigate(`/roles/${roleId}/edit`),
          },
        ]}
        position="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <CardWithIcon
            icon={Info}
            title="اطلاعات نقش"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            cardBorderColor="border-b-indigo-1"
            className="sticky top-20"
          >
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-6 px-4 border border-br bg-bg/50">
                <div className={`relative p-4 mb-4 ${isProtected
                    ? "bg-linear-to-br from-blue-1 to-indigo-1"
                    : "bg-linear-to-br from-gray-1 to-gray-2"
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
                <div className="p-4 border border-br bg-bg/50">
                  <label className="text-xs font-semibold text-font-s mb-2 block">توضیحات</label>
                  <p className="text-sm text-font-s leading-relaxed">{role.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center py-4 px-3 border border-br bg-blue-0/30">
                  <div className="flex items-center justify-center w-9 h-9 mb-2 bg-blue">
                    <Key className="w-4 h-4 text-blue-2" />
                  </div>
                  <span className="text-lg font-bold text-font-p">{basePermsCount}</span>
                  <span className="text-xs text-font-s text-center">پایه</span>
                </div>
                <div className="flex flex-col items-center justify-center py-4 px-3 border border-br bg-purple-0/30">
                  <div className="flex items-center justify-center w-9 h-9 mb-2 bg-purple">
                    <Sparkles className="w-4 h-4 text-purple-2" />
                  </div>
                  <span className="text-lg font-bold text-font-p">{specificPermsCount}</span>
                  <span className="text-xs text-font-s text-center">اختصاصی</span>
                </div>
                <div className="flex flex-col items-center justify-center py-4 px-3 border border-br bg-green-0/30">
                  <div className="flex items-center justify-center w-9 h-9 mb-2 bg-green">
                    <CheckCircle2 className="w-4 h-4 text-green-2" />
                  </div>
                  <span className="text-lg font-bold text-font-p">{totalPermsCount}</span>
                  <span className="text-xs text-font-s text-center">کل</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-br bg-bg/50">
                  <div className="p-2 bg-blue-0">
                    <Calendar className="h-4 w-4 text-blue-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-font-s block mb-1">تاریخ ایجاد</label>
                    <p className="text-sm font-medium text-font-p">{formatDate(role.created_at)}</p>
                  </div>
                </div>

                {role.updated_at && (
                  <div className="flex items-center gap-3 p-3 border border-br bg-bg/50">
                    <div className="p-2 bg-purple-0">
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
            cardBorderColor="border-b-blue-1"
            titleExtra={
              <Badge variant="blue" className="text-xs">
                {basePermsCount} دسترسی
              </Badge>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-font-s leading-relaxed p-3 bg-blue-0/30 border border-blue-1/20">
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
            cardBorderColor="border-b-purple-1"
            titleExtra={
              specificPermsCount > 0 ? (
                <Badge variant="purple" className="text-xs">
                  {specificPermsCount} دسترسی
                </Badge>
              ) : null
            }
          >
            {specificPermissionBadges.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-font-s leading-relaxed p-3 bg-purple-0/30 border border-purple-1/20">
                  دسترسی‌های اختصاصی که فقط به این نقش تعلق دارد.
                </p>
                <div className="flex flex-wrap gap-2">
                  {specificPermissionBadges.map((perm, index) => (
                    <Badge
                      key={`${perm.key}-${index}`}
                      variant="purple"
                      className="text-xs"
                    >
                      {perm.text}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-0 border-2 border-purple-1 mb-4">
                  <Shield className="h-8 w-8 text-purple-1" />
                </div>
                <p className="text-font-p font-semibold mb-2">فقط دسترسی‌های پایه</p>
                <p className="text-sm text-font-s">این نقش هیچ دسترسی اختصاصی ندارد</p>
              </div>
            )}
          </CardWithIcon>
        </div>
      </div>
    </div>
  );
}
