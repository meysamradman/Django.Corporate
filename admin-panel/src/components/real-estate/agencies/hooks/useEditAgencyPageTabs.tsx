import { lazy, useMemo } from "react";
import { Building2, UserCircle, Search, Share2, Settings } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { TabbedPageTab } from "@/components/templates/TabbedPageLayout";
import type { Media } from "@/types/shared/media";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import type { AgencyFormValues } from "@/components/real-estate/validations/agencySchema";

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencyInfo"));
const ProfileTab = lazy(() => import("@/components/real-estate/agencies/create/AgencyProfile"));
const SEOTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencySEO"));
const SettingsTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencySettings"));
const SocialTab = lazy(() => import("../edit/Social"));

interface UseEditAgencyPageTabsParams {
  form: UseFormReturn<AgencyFormValues>;
  selectedMedia: Media | null;
  setSelectedMedia: (media: Media | null) => void;
  socialMediaItems: SocialMediaItem[];
  onSocialMediaChange: (items: SocialMediaItem[]) => void;
  onFieldChange: (field: string, value: string | boolean | number | null) => void;
}

export function useEditAgencyPageTabs({
  form,
  selectedMedia,
  setSelectedMedia,
  socialMediaItems,
  onSocialMediaChange,
  onFieldChange,
}: UseEditAgencyPageTabsParams) {
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
          <SocialTab
            items={socialMediaItems}
            onChange={onSocialMediaChange}
          />
        ),
      },
    ],
    [form, onFieldChange, selectedMedia, setSelectedMedia, socialMediaItems, onSocialMediaChange]
  );

  return { tabs };
}
