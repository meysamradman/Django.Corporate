import { lazy, useMemo } from "react";
import { Building2, UserCircle, Settings, Search, Share2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { TabbedPageTab } from "@/components/templates/TabbedPageLayout";
import type { Media } from "@/types/shared/media";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import { SocialMediaArrayEditor } from "@/components/shared/SocialMediaArrayEditor";
import type { AgencyFormValues } from "@/components/real-estate/validations/agencySchema";

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencyInfo"));
const ProfileTab = lazy(() => import("@/components/real-estate/agencies/create/AgencyProfile"));
const SettingsTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencySettings"));
const SEOTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencySEO"));

interface UseCreateAgencyPageTabsParams {
  form: UseFormReturn<AgencyFormValues>;
  selectedMedia: Media | null;
  setSelectedMedia: (media: Media | null) => void;
  socialMediaItems: SocialMediaItem[];
  onSocialMediaChange: (items: SocialMediaItem[]) => void;
  onFieldChange: (field: string, value: unknown) => void;
}

export function useCreateAgencyPageTabs({
  form,
  selectedMedia,
  setSelectedMedia,
  socialMediaItems,
  onSocialMediaChange,
  onFieldChange,
}: UseCreateAgencyPageTabsParams) {
  const tabs: TabbedPageTab[] = useMemo(
    () => [
      {
        id: "account",
        label: "اطلاعات پایه",
        icon: <Building2 className="h-4 w-4" />,
        content: (
          <BaseInfoTab
            form={form}
            editMode={true}
            handleInputChange={onFieldChange}
          />
        ),
      },
      {
        id: "profile",
        label: "پروفایل",
        icon: <UserCircle className="h-4 w-4" />,
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
        id: "settings",
        label: "تنظیمات",
        icon: <Settings className="h-4 w-4" />,
        content: <SettingsTab form={form} editMode={true} />,
      },
      {
        id: "seo",
        label: "سئو",
        icon: <Search className="h-4 w-4" />,
        content: <SEOTab form={form} editMode={true} />,
      },
      {
        id: "social",
        label: "شبکه‌های اجتماعی",
        icon: <Share2 className="h-4 w-4" />,
        content: (
          <div className="rounded-lg border p-6">
            <SocialMediaArrayEditor items={socialMediaItems} onChange={onSocialMediaChange} />
          </div>
        ),
      },
    ],
    [form, onFieldChange, selectedMedia, setSelectedMedia, socialMediaItems, onSocialMediaChange]
  );

  return { tabs };
}
