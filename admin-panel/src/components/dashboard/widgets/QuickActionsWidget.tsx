import { type FC } from "react";
import {
    PlusCircle,
    Users,
    Image as ImageIcon,
    Settings,
    MessageSquare,
    Mail,
    Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/core/utils/cn";

interface QuickAction {
    label: string;
    icon: any;
    href: string;
    color: string;
    bgColor: string;
}

const actions: QuickAction[] = [
    {
        label: "نوشته جدید",
        icon: PlusCircle,
        href: "/blog/create",
        color: "text-blue-1",
        bgColor: "bg-blue-0",
    },
    {
        label: "مدیریت کاربران",
        icon: Users,
        href: "/users",
        color: "text-green-1",
        bgColor: "bg-green-0",
    },
    {
        label: "گالری تصاویر",
        icon: ImageIcon,
        href: "/media",
        color: "text-purple-1",
        bgColor: "bg-purple-0",
    },
    {
        label: "پیام‌های جدید",
        icon: Mail,
        href: "/support/emails",
        color: "text-pink-1",
        bgColor: "bg-pink-0",
    },
    {
        label: "تیکت‌های باز",
        icon: MessageSquare,
        href: "/support/tickets",
        color: "text-teal-1",
        bgColor: "bg-teal-0",
    },
    {
        label: "تنظیمات سیستم",
        icon: Settings,
        href: "/settings/general",
        color: "text-amber-1",
        bgColor: "bg-amber-0",
    },
];

export const QuickActionsWidget: FC<{ isLoading?: boolean }> = ({ isLoading }) => {
    if (isLoading) {
        return (
            <CardWithIcon
                icon={MousePointerClick}
                title="دسترسی سریع"
                iconBgColor="bg-primary/10"
                iconColor="stroke-primary"
                borderColor="border-b-primary"
                className="h-full w-full"
            >
                <div className="grid grid-cols-2 gap-4 h-full p-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-28 bg-bg animate-pulse border border-br/50" />
                    ))}
                </div>
            </CardWithIcon>
        );
    }

    return (
        <CardWithIcon
            icon={MousePointerClick}
            title="دسترسی سریع"
            iconBgColor="bg-primary/10"
            iconColor="stroke-primary"
            borderColor="border-b-primary"
            className="h-full w-full flex flex-col transition-all duration-500"
            contentClassName="flex-1 flex flex-col pt-4 px-4 pb-0"
            titleExtra={<p className="text-[10px] text-font-s opacity-60 font-black tracking-widest uppercase">Quick Control</p>}
        >
            <div className="grid grid-cols-2 gap-4 flex-1">
                {actions.map((action) => (
                    <Link
                        key={action.label}
                        to={action.href}
                        className="group relative flex flex-col items-center justify-center p-6 border border-br/60 bg-wt/40 hover:bg-wt hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 transition-all duration-500 overflow-hidden"
                    >
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700", action.bgColor)} />

                        <div className={cn("relative p-4 rounded-2xl mb-4 transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-2 shadow-sm", action.bgColor)}>
                            <action.icon className={cn("w-6 h-6", action.color)} />
                        </div>
                        <span className="relative text-[12px] font-black text-font-p text-center leading-tight tracking-tight">
                            {action.label}
                        </span>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-40 transition-opacity duration-500">
                            <Zap className={cn("w-3 h-3 h-white", action.color)} />
                        </div>
                    </Link>
                ))}
            </div>
        </CardWithIcon>
    );
};
