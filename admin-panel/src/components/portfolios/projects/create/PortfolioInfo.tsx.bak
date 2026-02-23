
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText, Settings } from "lucide-react";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";

import { PortfolioTitle } from "./title/PortfolioTitle";
import { PortfolioShortDesc } from "./descriptions/PortfolioShortDesc";
import { PortfolioDescription } from "./descriptions/PortfolioDescription";
import { PortfolioCategories } from "./categories/PortfolioCategories";
import { PortfolioTags } from "./tags/PortfolioTags";
import { PortfolioOptions } from "./options/PortfolioOptions";
import { PortfolioStatus } from "./status/PortfolioStatus";

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
    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = props.editMode;
    const portfolioId = props.portfolioId;

    const [categories, setCategories] = useState<PortfolioCategory[]>([]);
    const [tags, setTags] = useState<PortfolioTag[]>([]);
    const [options, setOptions] = useState<PortfolioOption[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(true);

    const { watch, setValue } = isFormApproach && form
        ? form
        : { watch: null, setValue: null };

    const commonProps = {
        form,
        formData,
        handleInputChange,
        editMode,
        isFormApproach
    };

    const formSelectedCategories = isFormApproach ? (watch?.("selectedCategories" as any) || []) : (props as any).selectedCategories || [];
    const formSelectedTags = isFormApproach ? watch?.("selectedTags") || [] : (props as any).selectedTags || [];
    const formSelectedOptions = isFormApproach ? watch?.("selectedOptions") || [] : (props as any).selectedOptions || [];

    useEffect(() => {
        const fetchTaxonomy = async () => {
            try {
                const [catsRes, tagsRes, optsRes] = await Promise.all([
                    portfolioApi.getCategories({ page: 1, size: 100 }),
                    portfolioApi.getTags({ page: 1, size: 100 }),
                    portfolioApi.getOptions({ page: 1, size: 100 })
                ]);
                setCategories(catsRes.data || []);
                setTags(tagsRes.data || []);
                setOptions(optsRes.data || []);
            } finally {
                setLoadingCategories(false);
                setLoadingTags(false);
                setLoadingOptions(false);
            }
        };
        fetchTaxonomy();
    }, []);

    const handleCategoryToggle = (category: PortfolioCategory) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedCategories" as any) || [];
            if (current.some((c: PortfolioCategory) => c.id === category.id)) {
                setValue("selectedCategories" as any, current.filter((c: PortfolioCategory) => c.id !== category.id), { shouldValidate: true });
            } else {
                setValue("selectedCategories" as any, [...current, category], { shouldValidate: true });
            }
        } else {
            (props as any).onCategoryToggle?.(category);
        }
    };

    const handleTagToggle = (tag: PortfolioTag) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedTags") || [];
            if (current.some((t: PortfolioTag) => t.id === tag.id)) {
                setValue("selectedTags", current.filter((t: PortfolioTag) => t.id !== tag.id), { shouldValidate: true });
            } else {
                setValue("selectedTags", [...current, tag], { shouldValidate: true });
            }
        } else {
            (props as any).onTagToggle?.(tag);
        }
    };

    const handleOptionToggle = (option: PortfolioOption) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedOptions") || [];
            if (current.some((o: PortfolioOption) => o.id === option.id)) {
                setValue("selectedOptions", current.filter((o: PortfolioOption) => o.id !== option.id), { shouldValidate: true });
            } else {
                setValue("selectedOptions", [...current, option], { shouldValidate: true });
            }
        } else {
            (props as any).onOptionToggle?.(option);
        }
    };

    return (
        <TabsContent value="account" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    <CardWithIcon
                        icon={FileText}
                        title="محتوا و توضیحات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                    >
                        <div className="space-y-6">
                            <PortfolioTitle {...commonProps} />
                            <PortfolioShortDesc {...commonProps} />
                            <PortfolioDescription {...commonProps} />
                        </div>
                    </CardWithIcon>
                </div>

                <div className="w-full lg:w-80 xl:w-96 lg:shrink-0 lg:sticky lg:top-6 self-start z-10">
                    <div className="flex flex-col gap-6">
                        <CardWithIcon
                            icon={Settings}
                            title="دسته‌بندی و برچسب‌ها"
                            iconBgColor="bg-purple"
                            iconColor="stroke-purple-2"
                            cardBorderColor="border-b-purple-1"
                        >
                            <div className="space-y-8">
                                <PortfolioCategories
                                    categories={categories}
                                    setCategories={setCategories}
                                    loadingCategories={loadingCategories}
                                    selectedCategories={formSelectedCategories}
                                    onToggle={handleCategoryToggle}
                                    editMode={editMode}
                                    errors={isFormApproach ? form?.formState.errors : {}}
                                />
                                <PortfolioTags
                                    tags={tags}
                                    setTags={setTags}
                                    loadingTags={loadingTags}
                                    selectedTags={formSelectedTags}
                                    onToggle={handleTagToggle}
                                    editMode={editMode}
                                    errors={isFormApproach ? form?.formState.errors : {}}
                                />
                                <PortfolioOptions
                                    options={options}
                                    setOptions={setOptions}
                                    loadingOptions={loadingOptions}
                                    selectedOptions={formSelectedOptions}
                                    onToggle={handleOptionToggle}
                                    editMode={editMode}
                                    errors={isFormApproach ? form?.formState.errors : {}}
                                />
                            </div>
                        </CardWithIcon>

                        <CardWithIcon
                            icon={Settings}
                            title="وضعیت نمایش و فعال‌سازی"
                            iconBgColor="bg-blue"
                            iconColor="stroke-blue-2"
                            cardBorderColor="border-b-blue-1"
                            showHeaderBorder={false}
                        >
                            <PortfolioStatus {...commonProps} />
                        </CardWithIcon>
                    </div>
                </div>
            </div>
        </TabsContent>
    );
}