
import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { realEstateApi } from "@/api/real-estate";
import { cn } from "@/core/utils/cn";
import { FormField } from "@/components/shared/FormField";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface PropertyAssignmentProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PropertyAssignment({ form, formData, handleInputChange, editMode, isFormApproach }: PropertyAssignmentProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const [agents, setAgents] = useState<PropertyAgent[]>([]);
    const [agencies, setAgencies] = useState<RealEstateAgency[]>([]);
    const [loadingAgents, setLoadingAgents] = useState(true);
    const [loadingAgencies, setLoadingAgencies] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
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
        };
        fetchData();
    }, []);

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <FormField
                label="مشاور مسئول"
                error={errors?.agent}
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
    );
}
