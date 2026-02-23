import { Card, CardContent } from "@/components/elements/Card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/elements/Tooltip";
import {
    ImageIcon,
    FileText,
    FolderOpen,
    Tag as TagIcon,
    PlayCircle,
    Search,
    Activity
} from "lucide-react";

interface BlogNavigationProps {
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
}

export function BlogNavigation({ activeSection, onSectionChange }: BlogNavigationProps) {
    const navItems = [
        { id: "gallery", label: "گالری تصاویر", icon: ImageIcon },
        { id: "overview", label: "مشخصات و محتوا", icon: FileText },
        { id: "stats", label: "آمار و بازخورد", icon: Activity },
        { id: "categories", label: "دسته‌بندی‌ها", icon: FolderOpen },
        { id: "tags", label: "تگ‌ها", icon: TagIcon },
        { id: "media", label: "رسانه‌ها", icon: PlayCircle },
        { id: "seo", label: "تنظیمات سئو", icon: Search },
    ];

    const scrollToSection = (sectionId: string) => {
        onSectionChange(sectionId);
        const element = document.getElementById(`section-${sectionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <aside className="hidden xl:block w-16 sticky top-24 self-start flex-none">
            <TooltipProvider>
                <Card className="gap-0 rounded-full shadow-lg ring-1 ring-static-b/5 border-br/50 items-center">
                    <CardContent className="p-2">
                        <nav className="flex flex-col gap-3">
                            {navItems.map((item) => (
                                <Tooltip key={item.id} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => scrollToSection(item.id)}
                                            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer group relative ${activeSection === item.id
                                                    ? "bg-blue-1 text-wt shadow-md shadow-blue-1/20 scale-110"
                                                    : "text-font-s hover:bg-bg hover:text-blue-1"
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={12}>
                                        <p className="text-[10px] font-black">{item.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </nav>
                    </CardContent>
                </Card>
            </TooltipProvider>
        </aside>
    );
}
