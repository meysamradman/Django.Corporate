import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings } from "lucide-react";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { PortfolioSidebarTaxonomy } from "./PortfolioSidebarTaxonomy";
import { PortfolioSidebarSettings } from "./PortfolioSidebarSettings";

interface PortfolioSidebarProps {
    form?: UseFormReturn<PortfolioFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
    selectedCategories: PortfolioCategory[];
    selectedTags: PortfolioTag[];
    selectedOptions: PortfolioOption[];
    onCategoryToggle?: (category: PortfolioCategory) => void;
    onTagToggle?: (tag: PortfolioTag) => void;
    onOptionToggle?: (option: PortfolioOption) => void;
    portfolioId?: number | string;
}

export function PortfolioSidebar({
    form,
    formData,
    handleInputChange,
    editMode,
    isFormApproach,
    onCategoryToggle,
    onTagToggle,
    onOptionToggle,
    portfolioId
}: PortfolioSidebarProps) {
    return (
        <CardWithIcon
            icon={Settings}
            title="تنظیمات"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
            className="lg:sticky lg:top-20"
            showHeaderBorder={false}
        >
            <div className="space-y-8">
                <PortfolioSidebarTaxonomy
                    form={form}
                    editMode={editMode}
                    isFormApproach={isFormApproach}
                    portfolioId={portfolioId}
                    onCategoryToggle={onCategoryToggle}
                    onTagToggle={onTagToggle}
                    onOptionToggle={onOptionToggle}
                />

                <PortfolioSidebarSettings
                    form={form}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    editMode={editMode}
                    isFormApproach={isFormApproach}
                />
            </div>
        </CardWithIcon>
    );
}
