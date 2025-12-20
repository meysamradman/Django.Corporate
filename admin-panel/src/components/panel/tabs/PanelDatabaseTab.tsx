import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { ProtectedButton } from '@/components/admins/permissions';
import { Skeleton } from "@/components/elements/Skeleton";
import { 
    Database,
    Download
} from 'lucide-react';
import { downloadDatabaseExport } from '@/api/panel/panel';
import { usePanelSettings } from '../hooks/usePanelSettings';

export function PanelDatabaseTab() {
    const { isLoading: isLoadingSettings } = usePanelSettings();

    if (isLoadingSettings) {
        return (
            <div className="space-y-6">
                <CardWithIcon
                    icon={Database}
                    title="پشتیبان‌گیری دیتابیس"
                    iconBgColor="bg-green"
                    iconColor="stroke-green-2"
                    borderColor="border-b-green-1"
                    className="hover:shadow-lg transition-all duration-300"
                    headerClassName="pb-3"
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardWithIcon>
            </div>
        );
    }

    return (
        <CardWithIcon
            icon={Database}
            title="پشتیبان‌گیری دیتابیس"
            iconBgColor="bg-green"
            iconColor="stroke-green-2"
            borderColor="border-b-green-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3"
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-font-s">
                        می‌توانید یک نسخه پشتیبان کامل از تمام داده‌های دیتابیس PostgreSQL را به صورت فایل SQL استاندارد دانلود کنید.
                    </p>
                    <p className="text-xs text-font-s/80">
                        این فایل SQL قابل استفاده در هر سرور PostgreSQL دیگر است و شامل تمام جداول، داده‌ها، ساختارها و روابط می‌شود.
                    </p>
                </div>
                <ProtectedButton
                    onClick={async () => {
                        try {
                            await downloadDatabaseExport();
                        } catch (error) {
                        }
                    }}
                    permission="panel.manage"
                    variant="outline"
                    className="w-full gap-2"
                >
                    <Download className="h-5 w-5" />
                    دانلود پشتیبان دیتابیس (SQL)
                </ProtectedButton>
            </div>
        </CardWithIcon>
    );
}

