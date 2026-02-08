
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/elements/Tabs";
import { generateSlug } from '@/core/slug/generate';
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { PortfolioContent } from "./info/PortfolioContent";
import { PortfolioSidebar } from "./info/PortfolioSidebar";

interface BaseInfoTabFormProps {
    form: UseFormReturn<PortfolioFormValues>;
    editMode: boolean;
    portfolioId?: number | string;
}

interface BaseInfoTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    selectedCategories: PortfolioCategory[];
    selectedTags: PortfolioTag[];
    selectedOptions: PortfolioOption[];
    onCategoryToggle: (category: PortfolioCategory) => void;
    onCategoryRemove: (categoryId: number) => void;
    onTagToggle: (tag: PortfolioTag) => void;
    onTagRemove: (tagId: number) => void;
    onOptionToggle: (option: PortfolioOption) => void;
    onOptionRemove: (optionId: number) => void;
    portfolioId?: number | string;
}

type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

export default function PortfolioInfo(props: BaseInfoTabProps) {
    const isFormApproach = 'form' in props;
    const form = isFormApproach ? (props as BaseInfoTabFormProps).form : undefined;
    const { watch, setValue } = isFormApproach && form
        ? form
        : { watch: null, setValue: null };

    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = isFormApproach ? (props as any).editMode : (props as any).editMode;
    const selectedCategories = isFormApproach ? [] : (props as any).selectedCategories || [];
    const selectedTags = isFormApproach ? [] : (props as any).selectedTags || [];
    const selectedOptions = isFormApproach ? [] : (props as any).selectedOptions || [];
    const onCategoryToggle = isFormApproach ? null : (props as any).onCategoryToggle;
    const onCategoryRemove = isFormApproach ? null : (props as any).onCategoryRemove;
    const onTagToggle = isFormApproach ? null : (props as any).onTagToggle;
    const onTagRemove = isFormApproach ? null : (props as any).onTagRemove;
    const onOptionToggle = isFormApproach ? null : (props as any).onOptionToggle;
    const onOptionRemove = isFormApproach ? null : (props as any).onOptionRemove;
    const portfolioId = isFormApproach ? props.portfolioId : props.portfolioId;

    const nameValue = isFormApproach ? watch?.("name") : formData?.name;

    useEffect(() => {
        if (isFormApproach && nameValue) {
            const slug = generateSlug(nameValue);
            setValue?.("slug", slug);
        }
    }, [nameValue, setValue, isFormApproach]);

    return (
        <TabsContent value="account" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        <PortfolioContent
                            form={form}
                            formData={formData}
                            handleInputChange={handleInputChange}
                            editMode={editMode}
                            isFormApproach={isFormApproach}
                        />
                    </div>
                </div>

                <div className="w-full lg:w-[420px] lg:shrink-0">
                    <PortfolioSidebar
                        form={form}
                        formData={formData}
                        handleInputChange={handleInputChange}
                        editMode={editMode}
                        isFormApproach={isFormApproach}
                        selectedCategories={selectedCategories}
                        selectedTags={selectedTags}
                        selectedOptions={selectedOptions}
                        onCategoryToggle={onCategoryToggle}
                        onCategoryRemove={onCategoryRemove}
                        onTagToggle={onTagToggle}
                        onTagRemove={onTagRemove}
                        onOptionToggle={onOptionToggle}
                        onOptionRemove={onOptionRemove}
                        portfolioId={portfolioId}
                    />
                </div>
            </div>
        </TabsContent>
    );
}