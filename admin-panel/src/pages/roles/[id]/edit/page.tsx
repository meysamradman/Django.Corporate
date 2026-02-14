import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRole, useUpdateRole, usePermissions, useBasePermissions } from "@/core/permissions";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  Save,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { extractFieldErrors, hasFieldErrors, showError } from '@/core/toast';
import { useUserPermissions } from "@/core/permissions";
import {
  StandardPermissionsTable,
  StatisticsPermissionsCard,
  AIPermissionsCard,
  ManagementPermissionsCard,
  RoleInfoForm,
} from "@/components/roles/form";
import { getResourceIcon } from "@/components/roles/form/utils";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { Switch } from "@/components/elements/Switch";
import { useRolePermissionBuckets } from "@/components/roles/hooks/useRolePermissionBuckets";
import { useRolePermissionSelection } from "@/components/roles/hooks/useRolePermissionSelection";
import { useRoleEditSelectedPermissionsInit } from "@/components/roles/hooks/useRoleEditSelectedPermissionsInit";
import { buildSpecificPermissionsPayload, getBasePermissionIds } from "@/components/roles/hooks/rolePermissionUtils";

const roleSchema = z.object({
  name: z.string().min(2, "نام نقش باید حداقل 2 کاراکتر باشد"),
  description: z.string().optional(),
  permission_ids: z.array(z.number()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function EditRolePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const roleId = parseInt(id || '0');
  const updateRoleMutation = useUpdateRole();
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const { data: basePermissions } = useBasePermissions();
  const { isSuperAdmin } = useUserPermissions();

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
  } = form;

  const {
    selectedPermissions,
    setSelectedPermissions,
    togglePermission,
    toggleAllResourcePermissions,
    isPermissionSelected,
    areAllResourcePermissionsSelected,
    getActionPermission,
  } = useRolePermissionSelection({
    permissions,
    setValue,
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || "",
      });
    }
  }, [role, reset]);

  useRoleEditSelectedPermissionsInit({
    role,
    permissions,
    basePermissions,
    setSelectedPermissions,
  });

  const {
    allPermissions,
    analyticsUsedPermissions,
    aiUsedPermissions,
    standaloneResources,
    managementTopResources,
    analyticsResources,
    aiResources,
    standardResources,
    moduleMasterPermissions,
  } = useRolePermissionBuckets({
    permissions: permissions || [],
    basePermissions: basePermissions || [],
  });

  const onSubmit = async (data: RoleFormData) => {
    try {
      const basePermissionIds = getBasePermissionIds(permissions || [], basePermissions || []);

      const userSelectedPermissions = selectedPermissions.filter(
        id => !basePermissionIds.includes(id)
      );

      const permissionsPayload = buildSpecificPermissionsPayload(
        permissions || [],
        userSelectedPermissions
      );

      const payload = {
        name: data.name,
        description: data.description,
        permissions: permissionsPayload,
      };

      await updateRoleMutation.mutateAsync({
        id: roleId,
        data: payload,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      navigate("/roles");
    } catch (error: any) {
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof RoleFormData, {
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

  if (roleLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
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
      <div className="text-center py-8">
        <p className="text-font-s">داده‌ای یافت نشد</p>
      </div>
    );
  }

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  const managementResources = [...standaloneResources, ...managementTopResources];
  const realEstateStandardResources = standardResources.filter((resource: any) =>
    (resource.resource || "").toLowerCase().startsWith("real_estate")
  );
  const nonRealEstateStandardResources = standardResources.filter((resource: any) =>
    !(resource.resource || "").toLowerCase().startsWith("real_estate")
  );

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
                      if (!moduleMasterPermissions || moduleMasterPermissions.length === 0) return null;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 border-b border-dashed border-green-500/20">
                          {moduleMasterPermissions.map((perm: any) => (
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
                      resources={nonRealEstateStandardResources}
                      enableFinalizeColumn={false}
                      selectedPermissions={selectedPermissions}
                      isSuperAdmin={isSuperAdmin}
                      logicalPermissionErrors={[]}
                      onTogglePermission={togglePermission}
                      onToggleAllResourcePermissions={toggleAllResourcePermissions}
                      allPermissions={allPermissions}
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

                    {realEstateStandardResources.length > 0 && (
                      <div className="pt-4 border-t border-dashed border-green-500/20">
                        <div className="text-sm font-semibold text-font-p mb-3">جدول کامل دسترسی‌های املاک</div>
                        <StandardPermissionsTable
                          resources={realEstateStandardResources}
                          enableFinalizeColumn={true}
                          selectedPermissions={selectedPermissions}
                          isSuperAdmin={isSuperAdmin}
                          logicalPermissionErrors={[]}
                          onTogglePermission={togglePermission}
                          onToggleAllResourcePermissions={toggleAllResourcePermissions}
                          allPermissions={allPermissions}
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
                      </div>
                    )}
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
                  allPermissions={allPermissions}
                />
              )}

              {managementResources.length > 0 && (
                <ManagementPermissionsCard
                  resources={managementResources}
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
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
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

        <RoleInfoForm
          form={form}
          onSubmit={onSubmit}
          isSubmitting={updateRoleMutation.isPending}
          submitButtonText="ذخیره"
          hideSubmitButton={true}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:right-80 z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          onClick={handleFormSubmit}
          size="lg"
          disabled={updateRoleMutation.isPending}
        >
          {updateRoleMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ذخیره تغییرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}