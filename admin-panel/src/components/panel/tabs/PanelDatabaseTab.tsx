import { useState, useEffect } from 'react';
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from '@/components/elements/Button';  // 🔒 تبدیل از ProtectedButton به Button
import { Skeleton } from "@/components/elements/Skeleton";
import {
    Database,
    Download
} from 'lucide-react';
import { downloadDatabaseExport, getDatabaseExportInfo } from '@/api/panel/panel';
import { usePanelSettings } from '../hooks/usePanelSettings';

export function PanelDatabaseTab() {
    usePanelSettings();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isLoadingDbInfo, setIsLoadingDbInfo] = useState(true);

    const [dbInfo, setDbInfo] = useState<{ size: string; table_count: number; top_tables: { name: string; size: string }[] } | null>(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                setIsLoadingDbInfo(true);
                const info = await getDatabaseExportInfo();
                setDbInfo(info);
            } catch (error) {
                console.error('Failed to fetch DB info', error);
            } finally {
                setIsLoadingDbInfo(false);
            }
        };
        fetchInfo();
    }, []);

    if (isLoadingDbInfo) {
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
                    {/* Stats Section Skeleton */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/5 rounded-lg p-3">
                            <Skeleton className="h-3 w-24 mb-2" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="bg-secondary/5 rounded-lg p-3">
                            <Skeleton className="h-3 w-24 mb-2" />
                            <Skeleton className="h-6 w-12" />
                        </div>
                    </div>
                    
                    {/* Description Skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                    </div>
                    
                    {/* Top Tables Skeleton */}
                    <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-secondary/5 px-4 py-2 border-b border-border">
                            <Skeleton className="h-3 w-40" />
                        </div>
                        <div className="divide-y divide-border/50">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex justify-between items-center px-4 py-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Button Skeleton */}
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardWithIcon>
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
            <div className="space-y-6">
                {/* Stats Section */}
                {dbInfo && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/5 rounded-lg p-3">
                            <p className="text-secondary/60 text-xs mb-1">حجم کل دیتابیس</p>
                            <p className="text-xl font-bold text-secondary">{dbInfo.size}</p>
                        </div>
                        <div className="bg-secondary/5 rounded-lg p-3">
                            <p className="text-secondary/60 text-xs mb-1">تعداد جداول</p>
                            <p className="text-xl font-bold text-secondary">{dbInfo.table_count}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-font-s">
                        می‌توانید یک نسخه پشتیبان کامل از تمام داده‌های دیتابیس PostgreSQL را به صورت فایل SQL استاندارد دانلود کنید.
                    </p>
                    <p className="text-xs text-font-s/80">
                        این فایل SQL قابل استفاده در هر سرور PostgreSQL دیگر است.
                    </p>
                </div>

                {/* Top Tables Section */}
                {dbInfo?.top_tables && dbInfo.top_tables.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-secondary/5 px-4 py-2 border-b border-border">
                            <p className="text-xs font-medium text-secondary">حجیم‌ترین جداول دیتابیس</p>
                        </div>
                        <div className="divide-y divide-border/50">
                            {dbInfo.top_tables.map((table, idx) => (
                                <div key={idx} className="flex justify-between items-center px-4 py-2 text-sm">
                                    <span className="text-font-main/80 dir-ltr font-mono text-xs">{table.name}</span>
                                    <span className="text-secondary font-medium">{table.size}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Button
                    onClick={async () => {
                        try {
                            setIsDownloading(true);
                            await downloadDatabaseExport();
                        } catch (error) {
                            // Error handled in downloadDatabaseExport
                        } finally {
                            setIsDownloading(false);
                        }
                    }}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isDownloading}
                >
                    <Download className="h-5 w-5" />
                    {isDownloading ? 'در حال دانلود...' : 'دانلود پشتیبان دیتابیس (SQL)'}
                </Button>
            </div>
        </CardWithIcon>
    );
}

