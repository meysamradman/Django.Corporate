import { useMemo, useState } from "react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Checkbox } from "@/components/elements/Checkbox";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Switch } from "@/components/elements/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Textarea } from "@/components/elements/Textarea";
import { AlertCircle, Camera, Eye, EyeOff, Image as ImageIcon, LockKeyhole, Pencil, Plus, Save, Search, Share2, ShieldCheck, Trash2, UserCircle, Users, X } from "lucide-react";
import { ADMIN_PERMISSION_ITEMS, ADMIN_ROLE_LIST, PROFILE_OVERVIEW_TABS } from "@/components/static/profile/data";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import type { Media } from "@/types/shared/media";
import { validatePassword } from "@/core/validation/password";
import { ConsultantStaticTab } from "@/components/static/profile/tabs/ConsultantStaticTab";
import { PropertiesStaticTab, type StaticPropertyItem } from "@/components/static/profile/tabs/PropertiesStaticTab";

interface AdminStaticForm {
  username: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  landline: string;
  mobile: string;
  email: string;
  province: string;
  city: string;
  address: string;
  bio: string;
  role: string;
  permissionIds: number[];
  isConsultant: boolean;
  consultantLicenseNumber: string;
  consultantLicenseExpireDate: string;
  consultantSpecialization: string;
  consultantAgencyName: string;
  consultantBio: string;
  consultantIsVerified: boolean;
  adminProperties: StaticPropertyItem[];
  consultantProperties: StaticPropertyItem[];
  isStaff: boolean;
  isSuperuser: boolean;
  newPassword: string;
  confirmPassword: string;
  socialMedia: SocialMediaItem[];
}

const createStaticSocialItem = (order: number): SocialMediaItem => ({
  name: "",
  url: "",
  icon: null,
  icon_data: null,
  order,
});

const resolveIconMedia = (item: SocialMediaItem): Media | null => {
  if (item.icon_data) {
    return item.icon_data;
  }

  if (item.icon_url) {
    return {
      id: item.icon ?? 0,
      public_id: item.public_id || `static-social-${item.icon ?? "temp"}`,
      file_url: item.icon_url,
    } as Media;
  }

  return null;
};

const DEFAULT_FORM: AdminStaticForm = {
  username: "barakat_admin",
  firstName: "باراکت",
  lastName: "الله",
  birthDate: "1375/05/10",
  nationalId: "0012345678",
  landline: "02112345678",
  mobile: "09124707989",
  email: "admin@example.com",
  province: "tehran",
  city: "tehran",
  address: "تهران، خیابان ولیعصر، پلاک 100",
  bio: "مدیر سیستم با تمرکز روی معماری، امنیت و بهینه‌سازی فرآیندهای ادمین.",
  role: "content_manager",
  permissionIds: [1, 2],
  isConsultant: true,
  consultantLicenseNumber: "12345",
  consultantLicenseExpireDate: "1405/12/30",
  consultantSpecialization: "مسکونی و اداری",
  consultantAgencyName: "آژانس املاک آرامش",
  consultantBio: "مشاور فعال در حوزه خرید، فروش و سرمایه‌گذاری ملکی.",
  consultantIsVerified: true,
  adminProperties: [
    { id: 101, title: "آپارتمان دو خوابه نیاوران", city: "تهران", category: "مسکونی", status: "فعال", price: "۱۲.۸ میلیارد" },
    { id: 102, title: "واحد اداری ولیعصر", city: "تهران", category: "اداری", status: "در انتظار", price: "۸.۲ میلیارد" },
  ],
  consultantProperties: [
    { id: 201, title: "پنت‌هاوس زعفرانیه", city: "تهران", category: "مسکونی", status: "فعال", price: "۳۵ میلیارد" },
    { id: 202, title: "دفتر کار پاسداران", city: "تهران", category: "اداری", status: "فعال", price: "۱۴ میلیارد" },
    { id: 203, title: "آپارتمان نوساز سعادت‌آباد", city: "تهران", category: "مسکونی", status: "در انتظار", price: "۱۸ میلیارد" },
  ],
  isStaff: true,
  isSuperuser: false,
  newPassword: "",
  confirmPassword: "",
  socialMedia: [
    {
      name: "اینستاگرام",
      url: "https://instagram.com/admin",
      icon: null,
      icon_data: null,
      order: 0,
    },
    {
      name: "تلگرام",
      url: "https://t.me/admin",
      icon: null,
      icon_data: null,
      order: 1,
    },
  ],
};

const PERMISSION_BADGE_VARIANT: Record<string, "green" | "blue" | "yellow" | "red"> = {
  create: "green",
  read: "blue",
  update: "yellow",
  delete: "red",
};

export function ProfileTabs() {
  const [savedForm, setSavedForm] = useState<AdminStaticForm>(DEFAULT_FORM);
  const [draftForm, setDraftForm] = useState<AdminStaticForm>(DEFAULT_FORM);
  const [editingSections, setEditingSections] = useState({
    adminInfo: false,
    consultant: false,
    permissions: false,
    security: false,
    social: false,
  });
  const [permissionSearchTerm, setPermissionSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [socialIconPicker, setSocialIconPicker] = useState<{ open: boolean; index: number | null }>({
    open: false,
    index: null,
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  type SectionKey = keyof typeof editingSections;

  const SECTION_FIELDS: Record<SectionKey, (keyof AdminStaticForm)[]> = {
    adminInfo: ["username", "firstName", "lastName", "birthDate", "nationalId", "landline", "mobile", "email", "province", "city", "address", "bio", "isStaff", "isSuperuser"],
    consultant: ["isConsultant", "consultantLicenseNumber", "consultantLicenseExpireDate", "consultantSpecialization", "consultantAgencyName", "consultantBio", "consultantIsVerified"],
    permissions: ["role", "permissionIds"],
    security: ["newPassword", "confirmPassword"],
    social: ["socialMedia"],
  };

  const permissionSource = useMemo(() => {
    return ADMIN_PERMISSION_ITEMS.map((item) => ({
      ...item,
      actionLabel:
        item.action === "create"
          ? "ایجاد"
          : item.action === "read"
            ? "مشاهده"
            : item.action === "update"
              ? "ویرایش"
              : item.action === "delete"
                ? "حذف"
                : item.action,
    }));
  }, []);

  const filteredRoles = useMemo(() => {
    if (!roleSearchTerm.trim()) return ADMIN_ROLE_LIST;

    const normalized = roleSearchTerm.toLowerCase();
    return ADMIN_ROLE_LIST.filter(
      (role) =>
        role.label.toLowerCase().includes(normalized) ||
        role.description.toLowerCase().includes(normalized) ||
        role.value.toLowerCase().includes(normalized)
    );
  }, [roleSearchTerm]);

  const effectivePermissionIds = editingSections.permissions ? draftForm.permissionIds : savedForm.permissionIds;
  const selectedRoleValue = editingSections.permissions ? draftForm.role : savedForm.role;
  const selectedRole = ADMIN_ROLE_LIST.find((role) => role.value === selectedRoleValue);

  const filteredPermissions = useMemo(() => {
    return permissionSource.filter((item) => {
      const bySearch =
        permissionSearchTerm.trim() === "" ||
        item.title.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
        item.codename.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
        item.module.toLowerCase().includes(permissionSearchTerm.toLowerCase());
      return bySearch;
    });
  }, [permissionSource, permissionSearchTerm]);

  const groupedFilteredPermissions = useMemo(() => {
    return filteredPermissions.reduce<Record<string, typeof filteredPermissions>>((acc, item) => {
      if (!acc[item.module]) {
        acc[item.module] = [];
      }
      acc[item.module].push(item);
      return acc;
    }, {});
  }, [filteredPermissions]);

  const provinceOptions = [
    { value: "tehran", label: "تهران" },
    { value: "alborz", label: "البرز" },
    { value: "isfahan", label: "اصفهان" },
  ];

  const cityByProvince: Record<string, { value: string; label: string }[]> = {
    tehran: [
      { value: "tehran", label: "تهران" },
      { value: "shahriar", label: "شهریار" },
    ],
    alborz: [
      { value: "karaj", label: "کرج" },
      { value: "fardis", label: "فردیس" },
    ],
    isfahan: [
      { value: "isfahan", label: "اصفهان" },
      { value: "kashan", label: "کاشان" },
    ],
  };

  const currentProvince = editingSections.adminInfo ? draftForm.province : savedForm.province;
  const cityOptions = cityByProvince[currentProvince] ?? [];
  const securityData = editingSections.security ? draftForm : savedForm;
  const passwordStrength = securityData.newPassword.length > 0
    ? (validatePassword(securityData.newPassword).isValid
      ? 100
      : securityData.newPassword.length >= 6 ? 60 : 30)
    : 0;

  function updateField<K extends keyof AdminStaticForm>(field: K, value: AdminStaticForm[K]) {
    setDraftForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateConsultantField(field: string, value: string | boolean) {
    updateField(field as keyof AdminStaticForm, value as never);
  }

  function resetSectionDraft(section: SectionKey) {
    const fields = SECTION_FIELDS[section];
    setDraftForm((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        next[field] = savedForm[field];
      });
      return next;
    });
  }

  function startSectionEdit(section: SectionKey) {
    resetSectionDraft(section);
    setEditingSections((prev) => ({ ...prev, [section]: true }));
  }

  function cancelSectionEdit(section: SectionKey) {
    resetSectionDraft(section);
    setEditingSections((prev) => ({ ...prev, [section]: false }));
  }

  function saveSectionEdit(section: SectionKey) {
    const fields = SECTION_FIELDS[section];
    setSavedForm((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        next[field] = draftForm[field];
      });
      return next;
    });
    setEditingSections((prev) => ({ ...prev, [section]: false }));
  }

  function sectionActions(section: SectionKey) {
    const isEditing = editingSections[section];

    if (!isEditing) {
      return (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => startSectionEdit(section)}>
          <Pencil className="size-4" />
          ویرایش
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => cancelSectionEdit(section)}>
          <X className="size-4" />
          انصراف
        </Button>
        <Button size="sm" className="gap-2" onClick={() => saveSectionEdit(section)}>
          <Save className="size-4" />
          ذخیره
        </Button>
      </div>
    );
  }

  function togglePermission(permissionId: number) {
    if (!editingSections.permissions) return;

    setDraftForm((prev) => {
      const exists = prev.permissionIds.includes(permissionId);
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter((id) => id !== permissionId)
          : [...prev.permissionIds, permissionId],
      };
    });
  }

  function selectAllFilteredPermissions() {
    if (!editingSections.permissions) return;

    const filteredIds = filteredPermissions.map((item) => item.id);
    setDraftForm((prev) => ({
      ...prev,
      permissionIds: Array.from(new Set([...prev.permissionIds, ...filteredIds])),
    }));
  }

  function clearAllFilteredPermissions() {
    if (!editingSections.permissions) return;

    const filteredIds = new Set(filteredPermissions.map((item) => item.id));
    setDraftForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.filter((id) => !filteredIds.has(id)),
    }));
  }

  function updateSocialItem(index: number, patch: Partial<SocialMediaItem>) {
    if (!editingSections.social) return;

    setDraftForm((prev) => ({
      ...prev,
      socialMedia: prev.socialMedia.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function addSocialItem() {
    if (!editingSections.social) return;

    setDraftForm((prev) => ({
      ...prev,
      socialMedia: [...prev.socialMedia, createStaticSocialItem(prev.socialMedia.length)],
    }));
  }

  function removeSocialItem(index: number) {
    if (!editingSections.social) return;

    setDraftForm((prev) => {
      const nextItems = prev.socialMedia.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...prev,
        socialMedia: nextItems.map((item, itemIndex) => ({ ...item, order: itemIndex })),
      };
    });
  }

  function openSocialIconPicker(index: number) {
    if (!editingSections.social) return;
    setSocialIconPicker({ open: true, index });
  }

  function closeSocialIconPicker() {
    setSocialIconPicker({ open: false, index: null });
  }

  function handleSocialIconSelect(selected: Media[] | Media) {
    if (socialIconPicker.index === null) {
      closeSocialIconPicker();
      return;
    }

    const media = Array.isArray(selected) ? selected[0] : selected;
    if (!media) {
      closeSocialIconPicker();
      return;
    }

    updateSocialItem(socialIconPicker.index, {
      icon: media.id,
      icon_data: media,
      icon_url: media.file_url,
    });

    closeSocialIconPicker();
  }

  function applyRoleTemplate(roleValue: string) {
    if (!editingSections.permissions) return;
    const role = ADMIN_ROLE_LIST.find((item) => item.value === roleValue);
    if (!role) return;

    setDraftForm((prev) => ({
      ...prev,
      role: role.value,
      permissionIds: [...role.permissionIds],
    }));
  }

  const tabMeta: Record<string, { icon: typeof UserCircle; iconWrap: string; iconColor: string; count: number }> = {
    "admin-info": {
      icon: UserCircle,
      iconWrap: "bg-blue/15 border-blue/30",
      iconColor: "text-blue-2",
      count: 5,
    },
    consultant: {
      icon: Users,
      iconWrap: "bg-green/15 border-green/30",
      iconColor: "text-green-2",
      count: 2,
    },
    properties: {
      icon: Share2,
      iconWrap: "bg-indigo/15 border-indigo/30",
      iconColor: "text-indigo-2",
      count: savedForm.isConsultant ? savedForm.consultantProperties.length : savedForm.adminProperties.length,
    },
    permissions: {
      icon: ShieldCheck,
      iconWrap: "bg-purple/15 border-purple/30",
      iconColor: "text-purple-2",
      count: effectivePermissionIds.length,
    },
    security: {
      icon: LockKeyhole,
      iconWrap: "bg-yellow/15 border-yellow/30",
      iconColor: "text-yellow-2",
      count: 1,
    },
    social: {
      icon: Share2,
      iconWrap: "bg-pink/15 border-pink/30",
      iconColor: "text-pink-2",
      count: savedForm.socialMedia.length,
    },
  };

  return (

    <div className="space-y-4">
      <Tabs defaultValue="admin-info" className="w-full">
        <TabsList className="no-scrollbar mb-6 flex w-full items-center justify-start gap-8 overflow-x-auto border-b border-br px-2">
          {PROFILE_OVERVIEW_TABS.map((tab) => {
            const meta = tabMeta[tab.value as keyof typeof tabMeta] ?? tabMeta["admin-info"];
            const TabIcon = meta.icon;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="group relative flex min-w-max items-center gap-2 py-4 text-sm font-medium text-font-s transition-all hover:text-font-p data-[state=active]:text-primary data-[state=active]:font-semibold"
              >
                <TabIcon className="size-4.5 opacity-70 transition-all group-hover:opacity-100 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary" />
                <span>{tab.label}</span>
                
                {meta.count > 0 && (
                  <span className="ms-1 flex size-5 items-center justify-center rounded-full bg-br/50 text-[10px] text-font-s font-medium transition-colors group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary">
                    {meta.count}
                  </span>
                )}

                <span className="absolute inset-x-0 -bottom-px h-0.5 scale-x-0 bg-primary transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="admin-info" className="space-y-4">
          <CardWithIcon
            icon={UserCircle}
            title="اطلاعات حساب کاربری و پروفایل"
            iconBgColor="bg-purple"
            iconColor="stroke-purple-2"
            cardBorderColor="border-b-purple-1"
            className="gap-0"
            titleExtra={sectionActions("adminInfo")}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-first-name">نام*</Label>
                  <Input
                    id="admin-first-name"
                    placeholder="نام خود را وارد کنید"
                    value={editingSections.adminInfo ? draftForm.firstName : savedForm.firstName}
                    disabled={!editingSections.adminInfo}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-last-name">نام خانوادگی*</Label>
                  <Input
                    id="admin-last-name"
                    placeholder="نام خانوادگی خود را وارد کنید"
                    value={editingSections.adminInfo ? draftForm.lastName : savedForm.lastName}
                    disabled={!editingSections.adminInfo}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-birth-date">تاریخ تولد</Label>
                  <Input
                    id="admin-birth-date"
                    placeholder="تاریخ تولد را انتخاب کنید"
                    value={editingSections.adminInfo ? draftForm.birthDate : savedForm.birthDate}
                    disabled={!editingSections.adminInfo}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-national-id">کد ملی</Label>
                  <Input
                    id="admin-national-id"
                    placeholder="کد ملی خود را وارد کنید"
                    value={editingSections.adminInfo ? draftForm.nationalId : savedForm.nationalId}
                    disabled={!editingSections.adminInfo}
                    onChange={(e) => updateField("nationalId", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-landline">تلفن</Label>
                  <Input
                    id="admin-landline"
                    placeholder="تلفن ثابت را وارد کنید"
                    value={editingSections.adminInfo ? draftForm.landline : savedForm.landline}
                    disabled={!editingSections.adminInfo}
                    onChange={(e) => updateField("landline", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-mobile">موبایل*</Label>
                  <Input
                    id="admin-mobile"
                    placeholder="09124707989"
                    value={editingSections.adminInfo ? draftForm.mobile : savedForm.mobile}
                    disabled={!editingSections.adminInfo}
                    onChange={(e) => updateField("mobile", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">ایمیل</Label>
                  <Input
                    id="admin-email"
                    placeholder="آدرس ایمیل خود را وارد کنید"
                    value={editingSections.adminInfo ? draftForm.email : savedForm.email}
                    disabled={!editingSections.adminInfo}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-province">استان</Label>
                  <Select
                    value={editingSections.adminInfo ? draftForm.province : savedForm.province}
                    onValueChange={(value) => {
                      updateField("province", value);
                      updateField("city", "");
                    }}
                    disabled={!editingSections.adminInfo}
                  >
                    <SelectTrigger id="admin-province">
                      <SelectValue placeholder="استان خود را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinceOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-city">شهر</Label>
                  <Select
                    value={editingSections.adminInfo ? draftForm.city : savedForm.city}
                    onValueChange={(value) => updateField("city", value)}
                    disabled={!editingSections.adminInfo || !currentProvince}
                  >
                    <SelectTrigger id="admin-city">
                      <SelectValue placeholder={currentProvince ? "شهر خود را انتخاب کنید" : "ابتدا استان را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-address">آدرس</Label>
                <Input
                  id="admin-address"
                  placeholder="آدرس خود را وارد کنید"
                  value={editingSections.adminInfo ? draftForm.address : savedForm.address}
                  disabled={!editingSections.adminInfo}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-bio">بیوگرافی</Label>
                <Textarea
                  id="admin-bio"
                  rows={4}
                  placeholder="بیوگرافی"
                  value={editingSections.adminInfo ? draftForm.bio : savedForm.bio}
                  disabled={!editingSections.adminInfo}
                  onChange={(e) => updateField("bio", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center justify-between rounded-xl border border-br bg-card-2 p-3">
                  <span className="text-sm text-font-p">وضعیت استاف</span>
                  <Switch checked={editingSections.adminInfo ? draftForm.isStaff : savedForm.isStaff} disabled={!editingSections.adminInfo} onCheckedChange={(value) => updateField("isStaff", value)} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-br bg-card-2 p-3">
                  <span className="text-sm text-font-p">سوپریوزر</span>
                  <Switch checked={editingSections.adminInfo ? draftForm.isSuperuser : savedForm.isSuperuser} disabled={!editingSections.adminInfo} onCheckedChange={(value) => updateField("isSuperuser", value)} />
                </div>
              </div>
            </div>
          </CardWithIcon>
        </TabsContent>

        <TabsContent value="consultant" className="space-y-4">
          <ConsultantStaticTab
            isEditMode={editingSections.consultant}
            isConsultant={editingSections.consultant ? draftForm.isConsultant : savedForm.isConsultant}
            licenseNumber={editingSections.consultant ? draftForm.consultantLicenseNumber : savedForm.consultantLicenseNumber}
            licenseExpireDate={editingSections.consultant ? draftForm.consultantLicenseExpireDate : savedForm.consultantLicenseExpireDate}
            specialization={editingSections.consultant ? draftForm.consultantSpecialization : savedForm.consultantSpecialization}
            agencyName={editingSections.consultant ? draftForm.consultantAgencyName : savedForm.consultantAgencyName}
            consultantBio={editingSections.consultant ? draftForm.consultantBio : savedForm.consultantBio}
            isVerified={editingSections.consultant ? draftForm.consultantIsVerified : savedForm.consultantIsVerified}
            onChange={updateConsultantField}
            titleExtra={sectionActions("consultant")}
          />
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <PropertiesStaticTab
            isConsultant={savedForm.isConsultant}
            adminProperties={savedForm.adminProperties}
            consultantProperties={savedForm.consultantProperties}
          />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <CardWithIcon
            icon={ShieldCheck}
            title="دسترسی‌های ادمین"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
            className="gap-0"
            titleExtra={sectionActions("permissions")}
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-br bg-card-1 p-3">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-font-s" />
                      <Input
                        value={roleSearchTerm}
                        onChange={(e) => setRoleSearchTerm(e.target.value)}
                        placeholder="جستجو در لیست نقش‌ها..."
                        className="pl-9"
                      />
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-font-s" />
                      <Input
                        value={permissionSearchTerm}
                        onChange={(e) => setPermissionSearchTerm(e.target.value)}
                        placeholder="جستجو در عنوان، کدنیم یا ماژول دسترسی..."
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-br bg-card p-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                      {filteredRoles.map((role) => {
                        const isSelected = selectedRoleValue === role.value;
                        return (
                          <button
                            key={role.value}
                            type="button"
                            className={`text-right rounded-lg border px-3 py-2 transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-br bg-card-2 hover:bg-card"}`}
                            onClick={() => applyRoleTemplate(role.value)}
                            disabled={!editingSections.permissions}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-font-p">{role.label}</p>
                              {role.isProtected ? <Badge variant="red">محافظت‌شده</Badge> : null}
                            </div>
                            <p className="text-xs text-font-s mt-1 line-clamp-1">{role.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-br bg-card p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="blue">دسترسی‌های فعال: {effectivePermissionIds.length}</Badge>
                        <Badge variant="gray">نمایش: {filteredPermissions.length}</Badge>
                        <Badge variant="outline">نقش: {selectedRole?.label ?? "بدون نقش"}</Badge>
                        {selectedRole?.isProtected ? <Badge variant="red">محافظت‌شده</Badge> : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" disabled={!editingSections.permissions} onClick={selectAllFilteredPermissions}>
                          انتخاب همه نتایج
                        </Button>
                        <Button size="sm" variant="outline" disabled={!editingSections.permissions} onClick={clearAllFilteredPermissions}>
                          پاک‌کردن نتایج
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {Object.entries(groupedFilteredPermissions).map(([moduleName, permissions]) => (
                      <div key={moduleName} className="rounded-xl border border-br bg-card p-2.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-font-s" />
                            <p className="font-semibold text-font-p">{moduleName}</p>
                          </div>
                          <Badge variant="outline">{permissions.length} دسترسی</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {permissions.map((item) => {
                            const checked = effectivePermissionIds.includes(item.id);
                            return (
                              <label
                                key={item.id}
                                htmlFor={`permission-static-${item.id}`}
                                className={`rounded-lg border p-2.5 cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "border-br bg-card-2"}`}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={`permission-static-${item.id}`}
                                    checked={checked}
                                    onCheckedChange={() => togglePermission(item.id)}
                                    disabled={!editingSections.permissions}
                                  />
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-medium text-font-p">{item.title}</p>
                                      <Badge variant={PERMISSION_BADGE_VARIANT[item.action] ?? "blue"}>{item.actionLabel}</Badge>
                                    </div>
                                    <p className="text-xs text-font-s">{item.codename}</p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {filteredPermissions.length === 0 && (
                      <div className="rounded-xl border border-dashed border-br p-6 text-center text-sm text-font-s">
                        نتیجه‌ای برای فیلتر فعلی پیدا نشد.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardWithIcon>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <CardWithIcon
            icon={LockKeyhole}
            title="امنیت حساب"
            iconBgColor="bg-yellow"
            iconColor="stroke-yellow-2"
            cardBorderColor="border-b-yellow-1"
            className="gap-0"
            titleExtra={sectionActions("security")}
          >
            <div className="space-y-4">
              {securityData.newPassword && passwordStrength < 100 ? (
                <Alert variant="default" className="bg-amber border-amber-1">
                  <AlertCircle className="h-4 w-4 text-amber-1" />
                  <AlertDescription className="text-amber-2">
                    مطمئن شوید رمز عبور حداقل ۸ کاراکتر، شامل حروف بزرگ و کاراکتر خاص باشد.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-new-password">رمز عبور جدید</Label>
                  <div className="relative">
                    <Input
                      id="admin-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={securityData.newPassword}
                      disabled={!editingSections.security}
                      onChange={(e) => updateField("newPassword", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      disabled={!editingSections.security}
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {securityData.newPassword ? (
                    <div className="space-y-1">
                      <div className="h-2 bg-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength < 40 ? "bg-danger-1" : passwordStrength < 70 ? "bg-amber-1" : "bg-green-1"}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                      <p className="text-xs text-font-s">
                        قدرت رمز: {passwordStrength < 40 ? "ضعیف" : passwordStrength < 70 ? "متوسط" : "قوی"}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-confirm-password">تکرار رمز عبور</Label>
                  <div className="relative">
                    <Input
                      id="admin-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={securityData.confirmPassword}
                      disabled={!editingSections.security}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      disabled={!editingSections.security}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {securityData.confirmPassword && securityData.newPassword !== securityData.confirmPassword ? (
                    <p className="text-xs text-danger-1">رمز عبور و تکرار آن یکسان نیستند.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </CardWithIcon>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <CardWithIcon
            icon={Share2}
            title="شبکه‌های اجتماعی"
            iconBgColor="bg-pink"
            iconColor="stroke-pink-2"
            cardBorderColor="border-b-pink-1"
            className="gap-0"
            titleExtra={sectionActions("social")}
          >
            <div className="space-y-2">
              {(editingSections.social ? draftForm.socialMedia : savedForm.socialMedia).map((item, index) => (
                <div key={item.id ?? `social-${index}`} className="rounded-lg border border-br bg-card p-3 hover:bg-card-2/30 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <p className="text-sm font-semibold text-font-p leading-none">{item.name || "شبکه اجتماعی"}</p>
                    </div>

                    {editingSections.social ? (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => removeSocialItem(index)}>
                        <Trash2 className="size-4" />
                        حذف
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-end">
                    <div className="space-y-1 lg:col-span-3">
                      <Label htmlFor={`social-name-${index}`} className="text-xs text-font-s">نام</Label>
                      <Input
                        id={`social-name-${index}`}
                        value={item.name || ""}
                        disabled={!editingSections.social}
                        onChange={(e) => updateSocialItem(index, { name: e.target.value })}
                        placeholder="مثال: اینستاگرام"
                      />
                    </div>

                    <div className="space-y-1 lg:col-span-7">
                      <Label htmlFor={`social-link-${index}`} className="text-xs text-font-s">لینک</Label>
                      <Input
                        id={`social-link-${index}`}
                        value={item.url || ""}
                        disabled={!editingSections.social}
                        onChange={(e) => updateSocialItem(index, { url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-1 lg:col-span-2">
                      <Label className="text-xs text-font-s">آیکون</Label>
                      <div className="flex items-center gap-2 h-9">
                        <div className="size-9 rounded-md border border-br bg-card-2 overflow-hidden flex items-center justify-center shrink-0">
                          {resolveIconMedia(item)?.file_url ? (
                            <img
                              src={resolveIconMedia(item)?.file_url}
                              alt={item.name || "icon"}
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="size-4 text-font-s" />
                          )}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1 px-2"
                          disabled={!editingSections.social}
                          onClick={() => openSocialIconPicker(index)}
                        >
                          <Camera className="size-4" />
                          عکس
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(editingSections.social ? draftForm.socialMedia : savedForm.socialMedia).length === 0 ? (
                <div className="rounded-xl border border-dashed border-br p-4 text-sm text-font-s">
                  هنوز شبکه اجتماعی اضافه نشده است.
                </div>
              ) : null}

              {editingSections.social ? (
                <Button variant="outline" className="gap-2 mt-1" onClick={addSocialItem}>
                  <Plus className="size-4" />
                  افزودن شبکه اجتماعی
                </Button>
              ) : null}

              <MediaLibraryModal
                isOpen={socialIconPicker.open}
                onClose={closeSocialIconPicker}
                onSelect={handleSocialIconSelect}
                selectMultiple={false}
                initialFileType="image"
                context="media_library"
              />
            </div>
          </CardWithIcon>
        </TabsContent>
      </Tabs>
    </div>
  );
}
