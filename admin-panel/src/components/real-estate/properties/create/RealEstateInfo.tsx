import { useState, useEffect, type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { TipTapEditor } from "@/components/shared/TipTapEditor";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FolderOpen, Tag, X, Settings, FileText } from "lucide-react";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { realEstateApi } from "@/api/real-estate";
import { cn } from "@/core/utils/cn";
import { FormFieldInput, FormFieldTextarea, FormField } from "@/components/shared/FormField";

import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";
import { formatSlug, generateSlug } from '@/core/slug/generate';

interface BaseInfoTabFormProps {
    form: UseFormReturn<PropertyFormValues>;
    editMode: boolean;
    selectedLabels: PropertyLabel[];
    selectedTags: PropertyTag[];
    selectedFeatures: PropertyFeature[];
    onLabelToggle: (label: PropertyLabel) => void;
    onLabelRemove: (labelId: number) => void;
    onTagToggle: (tag: PropertyTag) => void;
    onTagRemove: (tagId: number) => void;
    onFeatureToggle: (feature: PropertyFeature) => void;
    onFeatureRemove: (featureId: number) => void;
    propertyId?: number | string;
}

interface BaseInfoTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    selectedLabels: PropertyLabel[];
    selectedTags: PropertyTag[];
    selectedFeatures: PropertyFeature[];
    onLabelToggle: (label: PropertyLabel) => void;
    onLabelRemove: (labelId: number) => void;
    onTagToggle: (tag: PropertyTag) => void;
    onTagRemove: (tagId: number) => void;
    onFeatureToggle: (feature: PropertyFeature) => void;
    onFeatureRemove: (featureId: number) => void;
    propertyId?: number | string;
    errors?: Record<string, string>;
}

type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

export default function RealEstateInfo(props: BaseInfoTabProps) {
    const isFormApproach = 'form' in props;
    const { register, formState: { errors }, watch, setValue } = isFormApproach
        ? props.form
        : { register: null, formState: { errors: {} as any }, watch: null, setValue: null };
    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = isFormApproach ? (props as any).editMode : (props as any).editMode;
    const selectedLabels = isFormApproach ? [] : (props as any).selectedLabels || [];
    const selectedTags = isFormApproach ? [] : (props as any).selectedTags || [];
    const selectedFeatures = isFormApproach ? [] : (props as any).selectedFeatures || [];
    const onLabelToggle = isFormApproach ? null : (props as any).onLabelToggle;
    const onLabelRemove = isFormApproach ? null : (props as any).onLabelRemove;
    const onTagToggle = isFormApproach ? null : (props as any).onTagToggle;
    const onTagRemove = isFormApproach ? null : (props as any).onTagRemove;
    const onFeatureToggle = isFormApproach ? null : (props as any).onFeatureToggle;
    const onFeatureRemove = isFormApproach ? null : (props as any).onFeatureRemove;
    const descriptionValue = isFormApproach ? watch?.("description") : formData?.description;
    const formSelectedLabels = isFormApproach ? (props as BaseInfoTabFormProps).selectedLabels : selectedLabels || [];
    const formSelectedTags = isFormApproach ? (props as BaseInfoTabFormProps).selectedTags : selectedTags || [];
    const formSelectedFeatures = isFormApproach ? (props as BaseInfoTabFormProps).selectedFeatures : selectedFeatures || [];
    const formOnLabelToggle = isFormApproach ? (props as BaseInfoTabFormProps).onLabelToggle : onLabelToggle;
    const formOnLabelRemove = isFormApproach ? (props as BaseInfoTabFormProps).onLabelRemove : onLabelRemove;
    const formOnTagToggle = isFormApproach ? (props as BaseInfoTabFormProps).onTagToggle : onTagToggle;
    const formOnTagRemove = isFormApproach ? (props as BaseInfoTabFormProps).onTagRemove : onTagRemove;
    const formOnFeatureToggle = isFormApproach ? (props as BaseInfoTabFormProps).onFeatureToggle : onFeatureToggle;
    const formOnFeatureRemove = isFormApproach ? (props as BaseInfoTabFormProps).onFeatureRemove : onFeatureRemove;

    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [propertyStates, setPropertyStates] = useState<PropertyState[]>([]);
    const [labels, setLabels] = useState<PropertyLabel[]>([]);
    const [tags, setTags] = useState<PropertyTag[]>([]);
    const [features, setFeatures] = useState<PropertyFeature[]>([]);
    const [agents, setAgents] = useState<PropertyAgent[]>([]);
    const [agencies, setAgencies] = useState<RealEstateAgency[]>([]);

    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loadingStates, setLoadingStates] = useState(true);
    const [loadingLabels, setLoadingLabels] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);
    const [loadingFeatures, setLoadingFeatures] = useState(true);
    const [loadingAgents, setLoadingAgents] = useState(true);
    const [loadingAgencies, setLoadingAgencies] = useState(true);
    const [statusOptions, setStatusOptions] = useState<[string, string][]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const typesResponse = await realEstateApi.getTypes({ page: 1, size: 100, is_active: true });
                setPropertyTypes(typesResponse.data || []);
            } catch (error) {
            } finally {
                setLoadingTypes(false);
            }

            try {
                const statesResponse = await realEstateApi.getStates({ page: 1, size: 100, is_active: true });
                setPropertyStates(statesResponse.data || []);
            } catch (error) {
            } finally {
                setLoadingStates(false);
            }

            try {
                const labelsResponse = await realEstateApi.getLabels({ page: 1, size: 100, is_active: true });
                setLabels(labelsResponse.data || []);
            } catch (error) {
            } finally {
                setLoadingLabels(false);
            }

            try {
                const tagsResponse = await realEstateApi.getTags({ page: 1, size: 100, is_active: true, is_public: true });
                setTags(tagsResponse.data || []);
            } catch (error) {
            } finally {
                setLoadingTags(false);
            }

            try {
                const featuresResponse = await realEstateApi.getFeatures({ page: 1, size: 100, is_active: true });
                setFeatures(featuresResponse.data || []);
            } catch (error) {
            } finally {
                setLoadingFeatures(false);
            }

            try {
                const agentsResponse = await realEstateApi.getAgents({ page: 1, size: 100, is_active: true });
                setAgents(agentsResponse.data || []);
            } catch (error) {
            } finally {
                setLoadingAgents(false);
            }

            try {
                const agenciesResponse = await realEstateApi.getAgencies({ page: 1, size: 100, is_active: true });
                setAgencies(agenciesResponse.data || []);
            } catch (error) {
            } finally {
                setLoadingAgencies(false);
            }

            try {
                const optionsResponse = await realEstateApi.getFieldOptions();
                if (optionsResponse.status) {
                    setStatusOptions(optionsResponse.status);
                }
            } catch (error) {
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchData();
    }, []);

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach && setValue) {
            setValue("title", value, { shouldValidate: false });
            if (value) {
                const slug = generateSlug(value);
                setValue("slug", slug, { shouldValidate: false });
            }
        } else {
            handleInputChange?.("title", value);
            if (value && !formData?.slug) {
                const slug = generateSlug(value);
                handleInputChange?.("slug", slug);
            }
        }
    };

    const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedSlug = formatSlug(value);
        if (isFormApproach && setValue) {
            setValue("slug", formattedSlug, { shouldValidate: false });
        } else {
            handleInputChange?.("slug", formattedSlug);
        }
    };

    const handleShortDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (isFormApproach && setValue) {
            setValue("short_description", e.target.value, { shouldValidate: false });
        } else {
            handleInputChange?.("short_description", e.target.value);
        }
    };

    const handleDescriptionChange = (content: string) => {
        if (isFormApproach && setValue) {
            setValue("description", content, { shouldValidate: false });
        } else {
            handleInputChange?.("description", content);
        }
    };

    const handlePropertyTypeChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("property_type", value ? Number(value) : undefined!, { shouldValidate: false });
        } else {
            handleInputChange?.("property_type", value ? Number(value) : null);
        }
    };

    const handleStateChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("state", value ? Number(value) : undefined!, { shouldValidate: false });
        } else {
            handleInputChange?.("state", value ? Number(value) : null);
        }
    };

    const handleAgentChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("agent", value && value !== "none" ? Number(value) : null, { shouldValidate: false });
        } else {
            handleInputChange?.("agent", value && value !== "none" ? Number(value) : null);
        }
    };

    const handleAgencyChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("agency", value && value !== "none" ? Number(value) : null, { shouldValidate: false });
        } else {
            handleInputChange?.("agency", value && value !== "none" ? Number(value) : null);
        }
    };

    const handleStatusChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("status", value as any, { shouldValidate: false });
        } else {
            handleInputChange?.("status", value);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    <CardWithIcon
                        icon={FileText}
                        title="محتوا و توضیحات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {isFormApproach ? (
                                    <>
                                        <FormFieldInput
                                            label="عنوان"
                                            id="title"
                                            required
                                            placeholder="عنوان ملک"
                                            disabled={!editMode}
                                            error={errors.title?.message}
                                            {...(register ? register("title") : {})}
                                        />

                                        <FormFieldInput
                                            label="لینک (نامک)"
                                            id="slug"
                                            required
                                            placeholder="نامک"
                                            disabled={!editMode}
                                            error={errors.slug?.message}
                                            {...(register ? register("slug") : {})}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <FormFieldInput
                                            label="عنوان"
                                            id="title"
                                            required
                                            placeholder="عنوان ملک"
                                            disabled={!editMode}
                                            value={formData?.title || ""}
                                            onChange={handleNameChange}
                                            error={errors?.title}
                                        />

                                        <FormFieldInput
                                            label="لینک (نامک)"
                                            id="slug"
                                            required
                                            placeholder="نامک"
                                            disabled={!editMode}
                                            value={formData?.slug || ""}
                                            onChange={handleSlugChange}
                                            error={errors?.slug}
                                        />
                                    </>
                                )}
                            </div>

                            {isFormApproach ? (
                                <>
                                    <FormFieldTextarea
                                        label="توضیحات کوتاه"
                                        id="short_description"
                                        placeholder="یک توضیح کوتاه درباره ملک... (حداکثر ۳۰۰ کاراکتر)"
                                        rows={3}
                                        disabled={!editMode}
                                        maxLength={300}
                                        error={errors.short_description?.message}
                                        {...(register ? register("short_description") : {})}
                                    />

                                    <FormField
                                        label="توضیحات بلند"
                                        error={errors.description?.message}
                                    >
                                        <TipTapEditor
                                            content={descriptionValue || ""}
                                            onChange={handleDescriptionChange}
                                            placeholder="توضیحات کامل ملک را وارد کنید... (اختیاری)"
                                        />
                                    </FormField>
                                </>
                            ) : (
                                <>
                                    <FormFieldTextarea
                                        label="توضیحات کوتاه"
                                        id="short_description"
                                        placeholder="یک توضیح کوتاه درباره ملک... (حداکثر ۳۰۰ کاراکتر)"
                                        rows={3}
                                        disabled={!editMode}
                                        maxLength={300}
                                        value={formData?.short_description || ""}
                                        onChange={handleShortDescriptionChange}
                                        error={errors?.short_description}
                                    />

                                    <FormField
                                        label="توضیحات بلند"
                                        error={errors?.description}
                                    >
                                        <TipTapEditor
                                            content={formData?.description || ""}
                                            onChange={handleDescriptionChange}
                                            placeholder="توضیحات کامل ملک را وارد کنید... (اختیاری)"
                                        />
                                    </FormField>
                                </>
                            )}
                        </div>
                    </CardWithIcon>

                    <CardWithIcon
                        icon={Settings}
                        title="طبقه‌بندی و وضعیت"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                            <FormField
                                label="نوع ملک"
                                required
                                error={isFormApproach ? errors.property_type?.message : errors?.property_type}
                                className="lg:col-span-2"
                            >
                                <Select
                                    disabled={!editMode || loadingTypes}
                                    value={isFormApproach ? (watch?.("property_type") ? String(watch("property_type")) : "") : (formData?.property_type ? String(formData.property_type) : "")}
                                    onValueChange={handlePropertyTypeChange}
                                >
                                    <SelectTrigger className={cn((isFormApproach ? errors.property_type?.message : errors?.property_type) && "border-red-1")}>
                                        <SelectValue placeholder={loadingTypes ? "در حال بارگذاری..." : "نوع ملک را انتخاب کنید"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(propertyTypes || []).map((type) => (
                                            <SelectItem key={type.id} value={String(type.id)}>
                                                {type.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <FormField
                                label="وضعیت ملک"
                                required
                                error={isFormApproach ? errors.state?.message : errors?.state}
                                className="lg:col-span-2"
                            >
                                <Select
                                    disabled={!editMode || loadingStates}
                                    value={isFormApproach ? (watch?.("state") ? String(watch("state")) : "") : (formData?.state ? String(formData.state) : "")}
                                    onValueChange={handleStateChange}
                                >
                                    <SelectTrigger className={cn((isFormApproach ? errors.state?.message : errors?.state) && "border-red-1")}>
                                        <SelectValue placeholder={loadingStates ? "در حال بارگذاری..." : "مثلاً فروشی، اجاره‌ای..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(propertyStates || []).map((state) => (
                                            <SelectItem key={state.id} value={String(state.id)}>
                                                {state.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <FormField
                                label="وضعیت معامله"
                                required
                                error={isFormApproach ? errors.status?.message : errors?.status}
                                className="lg:col-span-2"
                            >
                                <Select
                                    disabled={!editMode || loadingOptions}
                                    value={isFormApproach ? (watch?.("status") || "") : (formData?.status || "")}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger className={cn((isFormApproach ? errors.status?.message : errors?.status) && "border-red-1")}>
                                        <SelectValue placeholder={loadingOptions ? "در حال بارگذاری..." : "انتخاب وضعیت..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <FormField
                                label="مشاور مسئول"
                                error={errors?.agent}
                                className="lg:col-span-3"
                            >
                                <Select
                                    disabled={!editMode || loadingAgents}
                                    value={isFormApproach ? (watch?.("agent") ? String(watch("agent")) : "none") : (formData?.agent ? String(formData.agent) : "none")}
                                    onValueChange={handleAgentChange}
                                >
                                    <SelectTrigger className={cn((isFormApproach ? errors.agent?.message : errors?.agent) && "border-red-1")}>
                                        <SelectValue placeholder={loadingAgents ? "در حال بارگذاری..." : "مشاور را انتخاب کنید"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">هیچکدام</SelectItem>
                                        {(agents || []).map((agent) => (
                                            <SelectItem key={agent.id} value={String(agent.id)}>
                                                {agent.first_name} {agent.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <FormField
                                label="آژانس املاک"
                                error={isFormApproach ? errors.agency?.message : errors?.agency}
                                className="lg:col-span-3"
                            >
                                <Select
                                    disabled={!editMode || loadingAgencies}
                                    value={isFormApproach ? (watch?.("agency") ? String(watch("agency")) : "none") : (formData?.agency ? String(formData.agency) : "none")}
                                    onValueChange={handleAgencyChange}
                                >
                                    <SelectTrigger className={cn((isFormApproach ? errors.agency?.message : errors?.agency) && "border-red-1")}>
                                        <SelectValue placeholder={loadingAgencies ? "در حال بارگذاری..." : "آژانس را انتخاب کنید"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">هیچکدام</SelectItem>
                                        {(agencies || []).map((agency) => (
                                            <SelectItem key={agency.id} value={String(agency.id)}>
                                                {agency.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </div>
                    </CardWithIcon>
                </div>

                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <CardWithIcon
                        icon={Settings}
                        title="تنظیمات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                        className="lg:sticky lg:top-20"
                    >
                        <div className="space-y-8">

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple rounded-lg">
                                        <FolderOpen className="w-4 h-4 stroke-purple-2" />
                                    </div>
                                    <Label>برچسب‌ها</Label>
                                </div>
                                <div className="space-y-2">
                                    {formSelectedLabels.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formSelectedLabels.map((label: PropertyLabel) => (
                                                <span
                                                    key={label.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-purple text-purple-2 transition hover:shadow-sm"
                                                >
                                                    {label.title}
                                                    <button
                                                        type="button"
                                                        className="text-purple-2 hover:text-purple-2 cursor-pointer"
                                                        title="حذف"
                                                        onClick={() => formOnLabelRemove?.(label.id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <Select
                                        disabled={!editMode || loadingLabels}
                                        onValueChange={(value) => {
                                            const label = labels.find((l: PropertyLabel) => String(l.id) === value);
                                            if (label) formOnLabelToggle?.(label);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingLabels ? "در حال بارگذاری..." : "برچسب‌ها را انتخاب کنید"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(labels || []).map((label: PropertyLabel) => {
                                                const isSelected = formSelectedLabels.some((l: PropertyLabel) => l.id === label.id);
                                                return (
                                                    <SelectItem
                                                        key={label.id}
                                                        value={String(label.id)}
                                                        disabled={isSelected}
                                                        className={isSelected ? "opacity-70" : undefined}
                                                    >
                                                        <div className="flex items-center justify-between w-full gap-2">
                                                            <span>{label.title}</span>
                                                            {isSelected && (
                                                                <span className="inline-flex items-center">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-2 shadow-[0_0_5px_rgba(107,33,168,0.7)]"></span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo rounded-lg">
                                        <Tag className="w-4 h-4 stroke-indigo-2" />
                                    </div>
                                    <Label>تگ‌ها</Label>
                                </div>
                                <div className="space-y-2">
                                    {formSelectedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formSelectedTags.map((tag: PropertyTag) => (
                                                <span
                                                    key={tag.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-indigo text-indigo-2 transition hover:shadow-sm"
                                                >
                                                    {tag.title}
                                                    <button
                                                        type="button"
                                                        className="text-indigo-2 hover:text-indigo-2 cursor-pointer"
                                                        title="حذف"
                                                        onClick={() => formOnTagRemove?.(tag.id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <Select
                                        disabled={!editMode || loadingTags}
                                        onValueChange={(value) => {
                                            const tag = tags.find((t: PropertyTag) => String(t.id) === value);
                                            if (tag) formOnTagToggle?.(tag);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingTags ? "در حال بارگذاری..." : "تگ‌ها را انتخاب کنید"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(tags || []).map((tag: PropertyTag) => {
                                                const isSelected = formSelectedTags.some((t: PropertyTag) => t.id === tag.id);
                                                return (
                                                    <SelectItem
                                                        key={tag.id}
                                                        value={String(tag.id)}
                                                        disabled={isSelected}
                                                        className={isSelected ? "opacity-70" : undefined}
                                                    >
                                                        <div className="flex items-center justify-between w-full gap-2">
                                                            <span>{tag.title}</span>
                                                            {isSelected && (
                                                                <span className="inline-flex items-center">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-2 shadow-[0_0_5px_rgba(55,48,163,0.7)]"></span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-teal rounded-lg">
                                        <Settings className="w-4 h-4 stroke-teal-2" />
                                    </div>
                                    <Label>ویژگی‌ها</Label>
                                </div>
                                <div className="space-y-2">
                                    {formSelectedFeatures.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formSelectedFeatures.map((feature: PropertyFeature) => (
                                                <span
                                                    key={feature.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-teal text-teal-2"
                                                >
                                                    {feature.title}
                                                    <button
                                                        type="button"
                                                        className="text-teal-2 hover:text-teal-2"
                                                        onClick={() => formOnFeatureRemove?.(feature.id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <Select
                                        disabled={!editMode || loadingFeatures}
                                        onValueChange={(value) => {
                                            const feature = features.find((f: PropertyFeature) => String(f.id) === value);
                                            if (feature) formOnFeatureToggle?.(feature);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingFeatures ? "در حال بارگذاری..." : "ویژگی‌ها را انتخاب کنید"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(features || []).map((feature: PropertyFeature) => {
                                                const isSelected = formSelectedFeatures.some((f: PropertyFeature) => f.id === feature.id);
                                                return (
                                                    <SelectItem
                                                        key={feature.id}
                                                        value={String(feature.id)}
                                                        disabled={isSelected}
                                                        className={isSelected ? "opacity-70" : undefined}
                                                    >
                                                        <div className="flex items-center justify-between w-full gap-2">
                                                            <span>{feature.title}</span>
                                                            {isSelected && (
                                                                <span className="inline-flex items-center">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_5px_rgba(13,148,136,0.7)]"></span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-br">
                                <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
                                    <Item variant="default" size="default" className="py-5">
                                        <div className="ml-4 p-2 bg-blue rounded-lg">
                                            <FolderOpen className="w-5 h-5 stroke-blue-2" />
                                        </div>
                                        <ItemContent>
                                            <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                                            <ItemDescription className="text-xs">
                                                اگر غیرفعال باشد ملک در سایت نمایش داده نمی‌شود.
                                            </ItemDescription>
                                        </ItemContent>
                                        <ItemActions>
                                            <Switch
                                                checked={isFormApproach ? (watch?.("is_public") ?? true) : (formData?.is_public ?? true)}
                                                disabled={!editMode}
                                                onCheckedChange={(checked) => {
                                                    if (isFormApproach && setValue) {
                                                        setValue("is_public", checked, { shouldValidate: false });
                                                    } else {
                                                        handleInputChange?.("is_public", checked);
                                                    }
                                                }}
                                            />
                                        </ItemActions>
                                    </Item>
                                </div>

                                <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                                    <Item variant="default" size="default" className="py-5">
                                        <div className="ml-4 p-2 bg-green rounded-lg">
                                            <Settings className="w-5 h-5 stroke-green-2" />
                                        </div>
                                        <ItemContent>
                                            <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                                            <ItemDescription className="text-xs">
                                                با غیرفعال شدن، ملک از لیست مدیریت نیز مخفی می‌شود.
                                            </ItemDescription>
                                        </ItemContent>
                                        <ItemActions>
                                            <Switch
                                                checked={isFormApproach ? (watch?.("is_active") ?? true) : (formData?.is_active ?? true)}
                                                disabled={!editMode}
                                                onCheckedChange={(checked) => {
                                                    if (isFormApproach && setValue) {
                                                        setValue("is_active", checked, { shouldValidate: false });
                                                    } else {
                                                        handleInputChange?.("is_active", checked);
                                                    }
                                                }}
                                            />
                                        </ItemActions>
                                    </Item>
                                </div>

                                <div className="rounded-xl border border-orange-1/40 bg-orange-0/30 hover:border-orange-1/60 transition-colors overflow-hidden">
                                    <Item variant="default" size="default" className="py-5">
                                        <div className="ml-4 p-2 bg-orange rounded-lg">
                                            <Tag className="w-5 h-5 stroke-orange-2" />
                                        </div>
                                        <ItemContent>
                                            <ItemTitle className="text-orange-2">وضعیت ویژه</ItemTitle>
                                            <ItemDescription className="text-xs">
                                                املاک ویژه در بخش‌های خاص سایت با اولویت نمایش داده می‌شوند.
                                            </ItemDescription>
                                        </ItemContent>
                                        <ItemActions>
                                            <Switch
                                                checked={isFormApproach ? (watch?.("is_featured") ?? false) : (formData?.is_featured ?? false)}
                                                disabled={!editMode}
                                                onCheckedChange={(checked) => {
                                                    if (isFormApproach && setValue) {
                                                        setValue("is_featured", checked, { shouldValidate: false });
                                                    } else {
                                                        handleInputChange?.("is_featured", checked);
                                                    }
                                                }}
                                            />
                                        </ItemActions>
                                    </Item>
                                </div>

                                <div className="rounded-xl border border-purple-1/40 bg-purple-0/30 hover:border-purple-1/60 transition-colors overflow-hidden">
                                    <Item variant="default" size="default" className="py-5">
                                        <div className="ml-4 p-2 bg-purple rounded-lg">
                                            <FileText className="w-5 h-5 stroke-purple-2" />
                                        </div>
                                        <ItemContent>
                                            <ItemTitle className="text-purple-2">منتشر شده</ItemTitle>
                                            <ItemDescription className="text-xs">
                                                ملک منتشر شده برای عموم قابل مشاهده است.
                                            </ItemDescription>
                                        </ItemContent>
                                        <ItemActions>
                                            <Switch
                                                checked={isFormApproach ? (watch?.("is_published") ?? false) : (formData?.is_published ?? false)}
                                                disabled={!editMode}
                                                onCheckedChange={(checked) => {
                                                    if (isFormApproach && setValue) {
                                                        setValue("is_published", checked, { shouldValidate: false });
                                                    } else {
                                                        handleInputChange?.("is_published", checked);
                                                    }
                                                }}
                                            />
                                        </ItemActions>
                                    </Item>
                                </div>
                            </div>
                        </div>
                    </CardWithIcon>
                </div>
            </div>
        </div>
    );
}

