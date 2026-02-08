
import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { cn } from "@/core/utils/cn";
import { FormField } from "@/components/shared/FormField";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface PropertyClassificationProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PropertyClassification({ form, formData, handleInputChange, editMode, isFormApproach }: PropertyClassificationProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [propertyStates, setPropertyStates] = useState<PropertyState[]>([]);
    const [agents, setAgents] = useState<PropertyAgent[]>([]);
    const [agencies, setAgencies] = useState<RealEstateAgency[]>([]);
    const [statusOptions, setStatusOptions] = useState<[string, string][]>([]);

    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loadingStates, setLoadingStates] = useState(true);
    const [loadingAgents, setLoadingAgents] = useState(true);
    const [loadingAgencies, setLoadingAgencies] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const typesResponse = await realEstateApi.getTypes({ page: 1, size: 100, is_active: true });
                setPropertyTypes(typesResponse.data || []);
            } finally {
                setLoadingTypes(false);
            }

            try {
                const statesResponse = await realEstateApi.getStates({ page: 1, size: 100, is_active: true });
                setPropertyStates(statesResponse.data || []);
            } finally {
                setLoadingStates(false);
            }

            try {
                const agentsResponse = await realEstateApi.getAgents({ page: 1, size: 100, is_active: true });
                setAgents(agentsResponse.data || []);
            } finally {
                setLoadingAgents(false);
            }

            try {
                const agenciesResponse = await realEstateApi.getAgencies({ page: 1, size: 100, is_active: true });
                setAgencies(agenciesResponse.data || []);
            } finally {
                setLoadingAgencies(false);
            }

            try {
                const optionsResponse = await realEstateApi.getFieldOptions();
                if (optionsResponse.status) {
                    setStatusOptions(optionsResponse.status);
                }
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchData();
    }, []);

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
    );
}
