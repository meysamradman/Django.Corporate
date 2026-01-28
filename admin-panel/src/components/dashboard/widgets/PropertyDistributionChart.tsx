import { useMemo, type FC } from "react";
import { Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon, Home, Building2 } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { formatNumber } from "@/core/utils/format";
import type { DashboardStats } from "@/types/analytics";

interface PropertyDistributionChartProps {
    stats: DashboardStats | undefined;
    isLoading?: boolean;
}

const TYPE_COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f43f5e", // rose
];

const STATE_COLORS = [
    "#F59E0B", // amber
    "#3B82F6", // blue
    "#10B981", // green
    "#8B5CF6", // violet
    "#6366F1", // indigo
    "#F43F5E", // rose
];

export const PropertyDistributionChart: FC<PropertyDistributionChartProps> = ({ stats, isLoading = false }) => {
    const typeData = [
        { name: "آپارتمان", value: 145 },
        { name: "ویلا", value: 89 },
        { name: "زمین", value: 67 },
        { name: "تجاری", value: 34 },
        { name: "کلنگی", value: 12 },
    ];

    const stateData = [
        { name: "فروش", value: 210 },
        { name: "اجاره", value: 95 },
        { name: "پیش‌فروش", value: 42 },
    ];

    /*
    const typeData = useMemo(() => {
        if (!stats?.properties_by_type) return [];
        return stats.properties_by_type.map((item) => ({
            name: item.property_type__title || "سایر",
            value: item.count,
        }));
    }, [stats]);

    const stateData = useMemo(() => {
        if (!stats?.properties_by_state) return [];
        return stats.properties_by_state.map((item) => ({
            name: item.state__title || "سایر",
            value: item.count,
        }));
    }, [stats]);
    */

    if (isLoading) {
        return (
            <CardWithIcon
                icon={PieChartIcon}
                title="توزیع املاک"
                iconBgColor="bg-primary/10"
                iconColor="stroke-primary"
                borderColor="border-b-primary"
                className="h-full w-full"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full p-4">
                    <div className="space-y-4">
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                </div>
            </CardWithIcon>
        );
    }

    const hasData = typeData.length > 0 || stateData.length > 0;

    return (
        <CardWithIcon
            icon={PieChartIcon}
            title="آنالیز توزیع املاک"
            iconBgColor="bg-primary/10"
            iconColor="stroke-primary"
            borderColor="border-b-primary"
            className="h-full w-full flex flex-col transition-all duration-500"
            contentClassName="flex-1 flex flex-col pt-6 px-4 pb-4"
            titleExtra={<p className="text-[10px] text-font-s opacity-60 font-black tracking-widest uppercase">Property Segmentation</p>}
        >
            {!hasData ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-12">
                    <PieChartIcon className="w-12 h-12 mb-4 stroke-[1]" />
                    <p className="text-sm font-bold">داده‌ای برای نمایش وجود ندارد</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-4 self-start mr-4">
                            <Home className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-black text-font-p">بر اساس نوع ملک</h3>
                        </div>
                        <div className="w-full h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={typeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {typeData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-4">
                            {typeData.map((item, index) => (
                                <div key={item.name} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length] }} />
                                    <span className="text-[11px] font-bold text-font-s">{item.name} ({formatNumber(item.value)})</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-4 self-start mr-4">
                            <Building2 className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-black text-font-p">بر اساس وضعیت معامله</h3>
                        </div>
                        <div className="w-full h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={stateData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stateData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={STATE_COLORS[index % STATE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-4">
                            {stateData.map((item, index) => (
                                <div key={item.name} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATE_COLORS[index % STATE_COLORS.length] }} />
                                    <span className="text-[11px] font-bold text-font-s">{item.name} ({formatNumber(item.value)})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </CardWithIcon>
    );
};
