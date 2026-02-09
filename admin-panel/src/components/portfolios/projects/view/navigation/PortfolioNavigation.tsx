
import {
    Image as ImageIcon,
    Search,
    LayoutGrid,
    PlayCircle,
    FolderOpen,
    Tag,
    FileCode,
    Settings
} from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/elements/Tooltip";
import { Card, CardContent } from "@/components/elements/Card";

interface PortfolioNavigationProps {
    activeSection?: string;
    onNavClick: (id: string) => void;
}

export function PortfolioNavigation({ activeSection, onNavClick }: PortfolioNavigationProps) {
    const navItems = [
        { id: "gallery", label: "گالری", icon: ImageIcon },
        { id: "overview", label: "مرور کلی", icon: LayoutGrid },
        { id: "categories", label: "دسته‌بندی‌ها", icon: FolderOpen },
        { id: "tags", label: "تگ‌ها", icon: Tag },
        { id: "options", label: "گزینه‌ها", icon: FileCode },
        { id: "media", label: "رسانه‌ها", icon: PlayCircle },
        { id: "attributes", label: "ویژگی‌ها", icon: Settings },
        { id: "seo", label: "سئو", icon: Search },
    ];

    return (
        <TooltipProvider>
            <Card className="gap-0 rounded-full shadow-lg ring-1 ring-static-b/5 border-br/50 items-center sticky top-24">
                <CardContent className="p-2">
                    <nav className="flex flex-col gap-3">
                        {navItems.map((item) => (
                            <Tooltip key={item.id} delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => onNavClick(item.id)}
                                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer group relative ${activeSection === item.id
                                            ? "bg-primary text-wt shadow-md shadow-primary/20 scale-110"
                                            : "text-font-s hover:bg-bg hover:text-primary"
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" sideOffset={12}>
                                    <p className="text-[10px] font-black">{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </nav>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
