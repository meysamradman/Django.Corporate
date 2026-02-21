import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { TabsContent } from "@/components/elements/Tabs";
import { Building2, Save, User } from "lucide-react";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import { SocialMediaArrayEditor } from "@/components/shared/SocialMediaArrayEditor";

interface SocialTabProps {
    adminSocialMedia: SocialMediaItem[];
    consultantSocialMedia: SocialMediaItem[];
    hasConsultantProfile: boolean;
    showAdminSection?: boolean;
    onAdminSocialMediaChange: (items: SocialMediaItem[]) => void;
    onConsultantSocialMediaChange: (items: SocialMediaItem[]) => void;
    handleSaveProfile: () => void;
    isReadOnly?: boolean;
}

export function Social({
    adminSocialMedia,
    consultantSocialMedia,
    hasConsultantProfile,
    showAdminSection = true,
    onAdminSocialMediaChange,
    onConsultantSocialMediaChange,
    handleSaveProfile,
    isReadOnly = false,
}: SocialTabProps) {
    return (
        <TabsContent value="social">
            <div className="space-y-6">
                {showAdminSection ? (
                    <CardWithIcon
                        icon={User}
                        title="شبکه‌های اجتماعی ادمین"
                        iconBgColor="bg-pink"
                        iconColor="stroke-pink-2"
                        cardBorderColor="border-b-pink-1"
                        className="hover:shadow-lg transition-all duration-300"
                    >
                        <SocialMediaArrayEditor
                            items={adminSocialMedia}
                            onChange={onAdminSocialMediaChange}
                            canEdit={!isReadOnly}
                        />
                    </CardWithIcon>
                ) : null}

                {hasConsultantProfile ? (
                    <CardWithIcon
                        icon={Building2}
                        title="شبکه‌های اجتماعی مشاور"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                        className="hover:shadow-lg transition-all duration-300"
                    >
                        <SocialMediaArrayEditor
                            items={consultantSocialMedia}
                            onChange={onConsultantSocialMediaChange}
                            canEdit={!isReadOnly}
                        />
                    </CardWithIcon>
                ) : null}

                {!isReadOnly ? (
                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={handleSaveProfile}>
                            <Save className="h-4 w-4" />
                            ذخیره تغییرات
                        </Button>
                    </div>
                ) : null}
            </div>
        </TabsContent>
    );
}