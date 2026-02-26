import { lazy, useMemo } from "react";
import { User, UserCircle, ShieldCheck, Building2, Share2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Media } from "@/types/shared/media";
import type { AdminFormValues } from "@/components/admins/validations/adminSchema";
import type { Role } from "@/types/auth/permission";
import type { TabbedPageTab } from "@/components/templates/TabbedPageLayout";
import type { SocialMediaItem } from "@/types/shared/socialMedia";

const BaseInfoTab = lazy(() => import("@/components/admins/edit/Info"));
const ProfileTab = lazy(() => import("@/components/admins/create/Profile"));
const PermissionsTab = lazy(() => import("@/components/admins/create/Permissions"));
const ConsultantFields = lazy(() => import("@/components/admins/ConsultantFields"));
const SocialMediaTab = lazy(() => import("@/components/admins/create/SocialMediaTab"));

interface UseEditAdminPageTabsParams {
  form: UseFormReturn<AdminFormValues>;
  canManageAccess: boolean;
  lockRoleType?: boolean;
  selectedMedia: Media | null;
  setSelectedMedia: (media: Media | null) => void;
  roles: Role[];
  loadingRoles: boolean;
  rolesError: string | null;
  formErrorVersion: string;
  adminSocialMedia: SocialMediaItem[];
  consultantSocialMedia: SocialMediaItem[];
  onAdminSocialMediaChange: (items: SocialMediaItem[]) => void;
  onConsultantSocialMediaChange: (items: SocialMediaItem[]) => void;
}

export function useEditAdminPageTabs({
  form,
  canManageAccess,
  lockRoleType = false,
  selectedMedia,
  setSelectedMedia,
  roles,
  loadingRoles,
  rolesError,
  formErrorVersion,
  adminSocialMedia,
  consultantSocialMedia,
  onAdminSocialMediaChange,
  onConsultantSocialMediaChange,
}: UseEditAdminPageTabsParams) {
  const adminRoleType = form.watch("admin_role_type");

  const tabs: TabbedPageTab[] = useMemo(
    () => [
      {
        id: "base-info",
        label: "اطلاعات پایه",
        icon: <User className="w-4 h-4" />,
        content: <BaseInfoTab form={form} editMode={true} canManageAccess={canManageAccess} lockRoleType={lockRoleType} />,
      },
      {
        id: "profile",
        label: "پروفایل",
        icon: <UserCircle className="w-4 h-4" />,
        content: (
          <ProfileTab
            form={form}
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
            editMode={true}
          />
        ),
      },
      {
        id: "consultant",
        label: "اطلاعات مشاور",
        icon: <Building2 className="w-4 h-4" />,
        isVisible: adminRoleType === "consultant",
        content: <ConsultantFields form={form} isEdit={true} canManageAccess={canManageAccess} />,
      },
      {
        id: "permissions",
        label: "دسترسی‌ها",
        icon: <ShieldCheck className="w-4 h-4" />,
        isVisible: canManageAccess && !lockRoleType,
        content: (
          <PermissionsTab
            form={form}
            roles={roles}
            loadingRoles={loadingRoles}
            rolesError={rolesError}
            editMode={canManageAccess}
          />
        ),
      },
      {
        id: "social",
        label: "شبکه‌های اجتماعی",
        icon: <Share2 className="w-4 h-4" />,
        content: (
          <SocialMediaTab
            adminSocialMedia={adminSocialMedia}
            consultantSocialMedia={consultantSocialMedia}
            isConsultant={adminRoleType === "consultant"}
            showAdminSection={canManageAccess && !lockRoleType}
            onAdminSocialMediaChange={onAdminSocialMediaChange}
            onConsultantSocialMediaChange={onConsultantSocialMediaChange}
          />
        ),
      },
    ],
    [
      adminRoleType,
      canManageAccess,
      lockRoleType,
      form,
      loadingRoles,
      roles,
      rolesError,
      selectedMedia,
      setSelectedMedia,
      formErrorVersion,
      adminSocialMedia,
      consultantSocialMedia,
      onAdminSocialMediaChange,
      onConsultantSocialMediaChange,
    ]
  );

  return {
    tabs,
  };
}
