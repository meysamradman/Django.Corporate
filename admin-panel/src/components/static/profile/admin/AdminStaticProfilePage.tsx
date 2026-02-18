import { useMemo, useState } from "react";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Pencil, Save, X } from "lucide-react";
import { AdminStaticSidebar } from "./AdminStaticSidebar";
import { staticAdminTabs, staticDefaultAdminForm, staticPermissionItems, staticRoleOptions, type StaticAdminFormState } from "./mockData";
import { AdminStaticAccountTab } from "./tabs/AdminStaticAccountTab";
import { AdminStaticProfileTab } from "./tabs/AdminStaticProfileTab";
import { AdminStaticPermissionsTab } from "./tabs/AdminStaticPermissionsTab";
import { AdminStaticSecurityTab } from "./tabs/AdminStaticSecurityTab";
import { AdminStaticSocialTab } from "./tabs/AdminStaticSocialTab";

export function AdminStaticProfilePage() {
  const [activeTab, setActiveTab] = useState(staticAdminTabs[0].value);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState<StaticAdminFormState>(staticDefaultAdminForm);

  const fullName = useMemo(() => `${form.firstName} ${form.lastName}`.trim(), [form.firstName, form.lastName]);

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function onStartEdit() {
    setIsEditMode(true);
  }

  function onCancelEdit() {
    setForm(staticDefaultAdminForm);
    setIsEditMode(false);
  }

  function onSave() {
    setIsEditMode(false);
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1">
          <AdminStaticSidebar
            fullName={fullName}
            roleLabel={staticRoleOptions.find((item) => item.value === form.role)?.label ?? "مدیر سیستم"}
            username={form.username}
            email={form.email}
            phone={form.phone}
            isSuperuser={form.isSuperuser}
            isStaff={form.isStaff}
          />
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-br bg-card p-3">
            <p className="text-sm text-font-p">
              حالت فعلی: <span className="font-medium">{isEditMode ? "ویرایش" : "مشاهده"}</span>
            </p>
            <div className="flex items-center gap-2">
              {!isEditMode ? (
                <Button onClick={onStartEdit} className="gap-2">
                  <Pencil className="size-4" />
                  ویرایش
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={onCancelEdit} className="gap-2">
                    <X className="size-4" />
                    انصراف
                  </Button>
                  <Button onClick={onSave} className="gap-2">
                    <Save className="size-4" />
                    ذخیره
                  </Button>
                </>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
            <TabsList className="w-full overflow-x-auto justify-start">
              {staticAdminTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="min-w-max">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="account" className="mt-4">
              <AdminStaticAccountTab
                isEditMode={isEditMode}
                username={form.username}
                email={form.email}
                isStaff={form.isStaff}
                isSuperuser={form.isSuperuser}
                onChange={updateField}
              />
            </TabsContent>

            <TabsContent value="profile" className="mt-4">
              <AdminStaticProfileTab
                isEditMode={isEditMode}
                firstName={form.firstName}
                lastName={form.lastName}
                birthDate={form.birthDate}
                nationalId={form.nationalId}
                phone={form.phone}
                province={form.province}
                city={form.city}
                address={form.address}
                bio={form.bio}
                onChange={(field, value) => updateField(field, value)}
              />
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <AdminStaticPermissionsTab
                isEditMode={isEditMode}
                role={form.role}
                customRole={form.customRole}
                roleOptions={staticRoleOptions}
                permissions={staticPermissionItems}
                onChangeRole={(value) => updateField("role", value)}
                onChangeCustomRole={(value) => updateField("customRole", value)}
              />
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <AdminStaticSecurityTab
                isEditMode={isEditMode}
                currentPassword={form.currentPassword}
                newPassword={form.newPassword}
                confirmPassword={form.confirmPassword}
                twoFactorEnabled={form.twoFactorEnabled}
                forcePasswordChange={form.forcePasswordChange}
                onChange={updateField}
              />
            </TabsContent>

            <TabsContent value="social" className="mt-4">
              <AdminStaticSocialTab
                isEditMode={isEditMode}
                instagram={form.instagram}
                telegram={form.telegram}
                whatsapp={form.whatsapp}
                linkedin={form.linkedin}
                website={form.website}
                onChange={(field, value) => updateField(field, value)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
