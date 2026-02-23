import {
    FileText,
    Image as ImageIcon,
    Search,
    Layers,
    LayoutGrid,
    PlayCircle
} from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/elements/Tooltip";
import { Card, CardContent } from "@/components/elements/Card";

interface RealEstateNavigationProps {
    activeSection?: string;
    onNavClick: (id: string) => void;
}

export function RealEstateNavigation({ activeSection, onNavClick }: RealEstateNavigationProps) {
    const navItems = [
        { id: "gallery", label: "گالری", icon: ImageIcon },
        { id: "overview", label: "مرور کلی", icon: FileText },
        { id: "features", label: "ویژگی‌ها و امکانات", icon: LayoutGrid },
        { id: "attributes", label: "مشخصات فنی", icon: Layers },
        { id: "media", label: "رسانه‌ها", icon: PlayCircle },
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
                                            ? "bg-blue-1 text-wt shadow-md shadow-blue-1/20 scale-110"
                                            : "text-font-s hover:bg-bg hover:text-blue-1"
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
