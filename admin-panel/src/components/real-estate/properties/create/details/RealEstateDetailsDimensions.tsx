
import { FormFieldInput } from "@/components/shared/FormField";
import { Label } from "@/components/elements/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { msg } from "@/core/messages";

interface RealEstateDetailsDimensionsProps {
    formData: any;
    editMode: boolean;
    errors?: Record<string, string>;
    fieldOptions: any;
    isLoadingOptions: boolean;
    handleNumericChange: (field: string) => (e: any) => void;
    handleSelectChange: (field: string) => (value: string) => void;
    handleInputChange: (field: string, value: any) => void;
}

export function RealEstateDetailsDimensions({
    formData,
    editMode,
    errors,
    fieldOptions,
    isLoadingOptions,
    handleNumericChange,
    handleSelectChange,
    handleInputChange
}: RealEstateDetailsDimensionsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FormFieldInput
                label="مساحت زمین (متر)"
                id="land_area"
                type="number"
                placeholder="مثلاً: 500"
                disabled={!editMode}
                value={formData?.land_area ?? ""}
                onChange={handleNumericChange("land_area")}
                error={errors?.land_area}
            />
            <FormFieldInput
                label="زیربنا / کف (متر)"
                id="built_area"
                type="number"
                placeholder="مثلاً: 120"
                disabled={!editMode}
                value={formData?.built_area ?? ""}
                onChange={handleNumericChange("built_area")}
                error={errors?.built_area}
            />

            <div className="space-y-2">
                <Label htmlFor="year_built">سال ساخت (شمسی)</Label>
                <FormFieldInput
                    id="year_built"
                    label=""
                    type="number"
                    placeholder={fieldOptions?.year_built ? `${fieldOptions.year_built.min} - ${fieldOptions.year_built.max}` : "مثلاً 1402"}
                    disabled={!editMode || isLoadingOptions}
                    value={formData?.year_built ?? ""}
                    onChange={handleNumericChange("year_built")}
                    error={errors?.year_built}
                    min={fieldOptions?.year_built?.min}
                    max={fieldOptions?.year_built?.max}
                />
            </div>

            <FormFieldInput
                label="تعداد کل طبقات"
                id="floors_in_building"
                type="number"
                placeholder="تعداد طبقات ساختمان"
                disabled={!editMode}
                value={formData?.floors_in_building ?? ""}
                onChange={handleNumericChange("floors_in_building")}
                error={errors?.floors_in_building}
            />

            <div className="space-y-2">
                <Label htmlFor="floor_number">طبقه ملک</Label>
                <Select
                    value={formData?.floor_number?.toString() || undefined}
                    onValueChange={handleSelectChange("floor_number")}
                    disabled={!editMode || isLoadingOptions}
                >
                    <SelectTrigger className="w-full border-br bg-wt">
                        <SelectValue placeholder="انتخاب طبقه" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions?.floor_number?.map((item: [number, string]) => (
                            <SelectItem key={item[0]} value={item[0].toString()}>
                                {(msg.realEstate().facilities.floor_number as any)[item[0]] || item[1]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.floor_number && <p className="text-xs text-red-1">{errors.floor_number}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="document_type">نوع سند</Label>
                <Select
                    value={formData?.document_type || undefined}
                    onValueChange={(value) => handleInputChange("document_type", value)}
                    disabled={!editMode || isLoadingOptions}
                >
                    <SelectTrigger className="w-full border-br bg-wt">
                        <SelectValue placeholder="انتخاب نوع سند" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions?.document_type?.map((item: [string, string]) => (
                            <SelectItem key={item[0]} value={item[0]}>
                                {item[1]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.document_type && <p className="text-xs text-red-1">{errors.document_type}</p>}
            </div>
        </div>
    );
}
