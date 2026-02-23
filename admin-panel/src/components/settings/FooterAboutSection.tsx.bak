import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, Edit, Plus } from "lucide-react";

import { settingsApi } from "@/api/settings/settings";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Skeleton } from "@/components/elements/Skeleton";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export function FooterAboutSection() {
    const openDrawer = useGlobalDrawerStore(state => state.open);

    const { data: aboutItems = [], isLoading } = useQuery({
        queryKey: ["footer-about"],
        queryFn: () => settingsApi.getFooterAbout(),
    });

    const about = useMemo(() => aboutItems[0] || null, [aboutItems]);

    const handleOpenSide = (id?: number) => {
        openDrawer(DRAWER_IDS.SETTINGS_FOOTER_ABOUT_FORM, { editId: id });
    };

    if (isLoading) {
        return (
            <CardWithIcon
                icon={Info}
                title="درباره فوتر"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                cardBorderColor="border-b-blue-1"
            >
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
            </CardWithIcon>
        );
    }

    return (
        <CardWithIcon
            icon={Info}
            title="درباره فوتر"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            cardBorderColor="border-b-indigo-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3"
            titleExtra={
                about ? (
                    <Button onClick={() => handleOpenSide(about.id)}>
                        <Edit />
                        ویرایش
                    </Button>
                ) : (
                    <Button onClick={() => handleOpenSide()}>
                        <Plus />
                        ایجاد
                    </Button>
                )
            }
        >
            {about ? (
                <div className="space-y-3">
                    <div className="text-sm font-bold text-font-p">{about.title}</div>
                    <div className="text-xs text-font-s whitespace-pre-line leading-6">
                        {about.text}
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-font-s">
                    محتوایی برای «درباره فوتر» ثبت نشده است
                </div>
            )}
        </CardWithIcon>
    );
}
