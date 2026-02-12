import { lazy, useMemo } from "react";
import { User, UserCircle, ShieldCheck, Building2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Media } from "@/types/shared/media";
import type { AdminFormValues } from "@/components/admins/validations/adminSchema";
import type { Role } from "@/types/auth/permission";
import type { TabbedPageTab } from "@/components/templates/TabbedPageLayout";

const BaseInfoTab = lazy(() => import("@/components/admins/create/Info"));
const ProfileTab = lazy(() => import("@/components/admins/create/Profile"));
const PermissionsTab = lazy(() => import("@/components/admins/create/Permissions"));
const ConsultantFields = lazy(() => import("@/components/admins/ConsultantFields"));

interface UseCreateAdminPageTabsParams {
  form: UseFormReturn<AdminFormValues>;
  editMode: boolean;
  selectedMedia: Media | null;
  setSelectedMedia: (media: Media | null) => void;
  roles: Role[];
  loadingRoles: boolean;
  rolesError: string | null;
}

export function useCreateAdminPageTabs({
  form,
  editMode,
  selectedMedia,
  setSelectedMedia,
  roles,
  loadingRoles,
  rolesError,
}: UseCreateAdminPageTabsParams) {
  const adminRoleType = form.watch("admin_role_type");

  const tabs: TabbedPageTab[] = useMemo(
    () => [
      {
        id: "base-info",
        label: "اطلاعات پایه",
        icon: <User className="w-4 h-4" />,
        content: <BaseInfoTab form={form} editMode={editMode} />,
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
            editMode={editMode}
          />
        ),
      },
      {
        id: "consultant",
        label: "اطلاعات مشاور",
        icon: <Building2 className="w-4 h-4" />,
        isVisible: adminRoleType === "consultant",
        content: <ConsultantFields form={form} isEdit={false} />,
      },
      {
        id: "permissions",
        label: "دسترسی‌ها",
        icon: <ShieldCheck className="w-4 h-4" />,
        content: (
          <PermissionsTab
            form={form}
            roles={roles}
            loadingRoles={loadingRoles}
            rolesError={rolesError}
            editMode={editMode}
          />
        ),
      },
    ],
    [adminRoleType, editMode, form, loadingRoles, roles, rolesError, selectedMedia, setSelectedMedia]
  );

  return {
    tabs,
  };
}
