import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Building2, User } from "lucide-react";
import { SocialMediaArrayEditor } from "@/components/shared/SocialMediaArrayEditor";
import type { SocialMediaItem } from "@/types/shared/socialMedia";

interface SocialMediaTabProps {
  adminSocialMedia: SocialMediaItem[];
  consultantSocialMedia: SocialMediaItem[];
  isConsultant: boolean;
  showAdminSection?: boolean;
  onAdminSocialMediaChange: (items: SocialMediaItem[]) => void;
  onConsultantSocialMediaChange: (items: SocialMediaItem[]) => void;
}

export default function SocialMediaTab({
  adminSocialMedia,
  consultantSocialMedia,
  isConsultant,
  showAdminSection = true,
  onAdminSocialMediaChange,
  onConsultantSocialMediaChange,
}: SocialMediaTabProps) {
  return (
    <div className="space-y-6">
      {showAdminSection ? (
        <CardWithIcon
          icon={User}
          title="شبکه‌های اجتماعی ادمین"
          iconBgColor="bg-pink"
          iconColor="stroke-pink-2"
          cardBorderColor="border-b-pink-1"
        >
          <SocialMediaArrayEditor
            items={adminSocialMedia}
            onChange={onAdminSocialMediaChange}
          />
        </CardWithIcon>
      ) : null}

      {isConsultant ? (
        <CardWithIcon
          icon={Building2}
          title="شبکه‌های اجتماعی مشاور"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          cardBorderColor="border-b-blue-1"
        >
          <SocialMediaArrayEditor
            items={consultantSocialMedia}
            onChange={onConsultantSocialMediaChange}
          />
        </CardWithIcon>
      ) : null}
    </div>
  );
}
