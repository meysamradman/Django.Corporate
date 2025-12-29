import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { FormFieldInput } from "@/components/forms/FormField";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Home, DollarSign, Car, Box, Info } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Label } from "@/components/elements/Label";

interface DetailsTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    errors?: Record<string, string>;
}

export default function DetailsTab({ formData, handleInputChange, editMode, errors }: DetailsTabProps) {
    const [fieldOptions, setFieldOptions] = useState<any>(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    // Load field options from API
    useEffect(() => {
        const loadFieldOptions = async () => {
            try {
                setIsLoadingOptions(true);
                const options = await realEstateApi.getFieldOptions();
                setFieldOptions(options);
            } catch (error) {
                console.error('Failed to load field options:', error);
            } finally {
                setIsLoadingOptions(false);
            }
        };
        loadFieldOptions();
    }, []);

    // Generic handler for numeric inputs
    const handleNumericChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "") {
            handleInputChange(field, null);
            return;
        }
        const num = Number(val);
        if (!isNaN(num)) {
            handleInputChange(field, num);
        }
    };

    // Dropdown handler for select fields
    const handleSelectChange = (field: string) => (value: string) => {
        const num = value === "" ? null : Number(value);
        handleInputChange(field, num);
    };

    return (
        <div className="space-y-6">
            <CardWithIcon
                icon={Home}
                title="مشخصات ملک"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormFieldInput
                        label="متراژ زمین (متر)"
                        id="land_area"
                        type="number"
                        placeholder="0"
                        disabled={!editMode}
                        value={formData?.land_area ?? ""}
                        onChange={handleNumericChange("land_area")}
                        error={errors?.land_area}
                    />
                    <FormFieldInput
                        label="زیربنا (متر)"
                        id="built_area"
                        type="number"
                        placeholder="0"
                        disabled={!editMode}
                        value={formData?.built_area ?? ""}
                        onChange={handleNumericChange("built_area")}
                        error={errors?.built_area}
                    />
                    {/* Bedrooms - Dropdown */}
                    <div className="space-y-2">
                        <Label htmlFor="bedrooms">تعداد خواب *</Label>
                        <Select
                            value={formData?.bedrooms?.toString() ?? ""}
                            onValueChange={handleSelectChange("bedrooms")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.bedrooms?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.bedrooms && <p className="text-sm text-red-500">{errors.bedrooms}</p>}
                    </div>

                    {/* Bathrooms - Dropdown */}
                    <div className="space-y-2">
                        <Label htmlFor="bathrooms">تعداد سرویس/حمام *</Label>
                        <Select
                            value={formData?.bathrooms?.toString() ?? ""}
                            onValueChange={handleSelectChange("bathrooms")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.bathrooms?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.bathrooms && <p className="text-sm text-red-500">{errors.bathrooms}</p>}
                    </div>

                    {/* Year Built - Number Input با راهنما */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="year_built">
                                سال ساخت (شمسی)
                            </Label>
                            {fieldOptions?.year_built && (
                                <span className="text-xs text-muted-foreground">
                                    ({fieldOptions.year_built.min} - {fieldOptions.year_built.max})
                                </span>
                            )}
                        </div>
                        <FormFieldInput
                            id="year_built"
                            label="" 
                            type="number"
                            placeholder={fieldOptions?.year_built?.placeholder || "مثلاً 1402"}
                            disabled={!editMode || isLoadingOptions}
                            value={formData?.year_built ?? ""}
                            onChange={handleNumericChange("year_built")}
                            error={errors?.year_built}
                            min={fieldOptions?.year_built?.min}
                            max={fieldOptions?.year_built?.max}
                        />
                        {fieldOptions?.year_built?.help_text && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
                                <Info className="w-3 h-3 mt-0.5" />
                                <span>{fieldOptions.year_built.help_text}</span>
                            </div>
                        )}
                    </div>
                    <FormFieldInput
                        label="تعداد طبقات ساختمان"
                        id="floors_in_building"
                        type="number"
                        placeholder="0"
                        disabled={!editMode}
                        value={formData?.floors_in_building ?? ""}
                        onChange={handleNumericChange("floors_in_building")}
                        error={errors?.floors_in_building}
                    />
                    {/* Parking Spaces - Dropdown */}
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="parking_spaces">
                                <Car className="w-4 h-4 inline ml-1" />
                                پارکینگ
                            </Label>
                            <Select
                                value={formData?.parking_spaces?.toString() ?? ""}
                                onValueChange={handleSelectChange("parking_spaces")}
                                disabled={!editMode || isLoadingOptions}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="انتخاب کنید" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fieldOptions?.parking_spaces?.map((item: [number, string]) => (
                                        <SelectItem key={item[0]} value={item[0].toString()}>
                                            {item[1]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors?.parking_spaces && <p className="text-sm text-red-500">{errors.parking_spaces}</p>}
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="storage_rooms">
                                <Box className="w-4 h-4 inline ml-1" />
                                انباری
                            </Label>
                            <Select
                                value={formData?.storage_rooms?.toString() ?? ""}
                                onValueChange={handleSelectChange("storage_rooms")}
                                disabled={!editMode || isLoadingOptions}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="انتخاب کنید" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fieldOptions?.storage_rooms?.map((item: [number, string]) => (
                                        <SelectItem key={item[0]} value={item[0].toString()}>
                                            {item[1]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors?.storage_rooms && <p className="text-sm text-red-500">{errors.storage_rooms}</p>}
                        </div>
                    </div>

                    {/* Kitchen & Living Rooms - داینامیک از API */}
                    <div className="space-y-2">
                        <Label htmlFor="kitchens">تعداد آشپزخانه</Label>
                        <Select
                            value={formData?.kitchens?.toString() ?? "1"}
                            onValueChange={handleSelectChange("kitchens")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.kitchens?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.kitchens && <p className="text-sm text-red-500">{errors.kitchens}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="living_rooms">تعداد پذیرایی</Label>
                        <Select
                            value={formData?.living_rooms?.toString() ?? "1"}
                            onValueChange={handleSelectChange("living_rooms")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.living_rooms?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.living_rooms && <p className="text-sm text-red-500">{errors.living_rooms}</p>}
                    </div>

                    {/* Floor Number */}
                    <div className="space-y-2">
                        <Label htmlFor="floor_number">شماره طبقه</Label>
                        <Select
                            value={formData?.floor_number?.toString() ?? ""}
                            onValueChange={handleSelectChange("floor_number")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.floor_number?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.floor_number && <p className="text-sm text-red-500">{errors.floor_number}</p>}
                    </div>

                    {/* Document Type */}
                    <div className="space-y-2">
                        <Label htmlFor="document_type">نوع سند</Label>
                        <Select
                            value={formData?.document_type ?? "none"}
                            onValueChange={(value) => handleInputChange("document_type", value === "none" ? null : value)}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">بدون انتخاب</SelectItem>
                                {fieldOptions?.document_type?.map((item: [string, string]) => (
                                    <SelectItem key={item[0]} value={item[0]}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.document_type && <p className="text-sm text-red-500">{errors.document_type}</p>}
                    </div>
                </div>
            </CardWithIcon>

            <CardWithIcon
                icon={DollarSign}
                title="قیمت و شرایط"
                iconBgColor="bg-green"
                iconColor="stroke-green-2"
                borderColor="border-b-green-1"
            >
                <div className="space-y-6">
                    {/* Currency & Negotiable - داینامیک از API */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="currency">واحد پول</Label>
                            <Select
                                value={formData?.currency ?? "IRR"}
                                onValueChange={(value) => handleInputChange("currency", value)}
                                disabled={!editMode || isLoadingOptions}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {fieldOptions?.currency?.map((item: [string, string]) => (
                                        <SelectItem key={item[0]} value={item[0]}>
                                            {item[1]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="is_negotiable">قابلیت چانه‌زنی</Label>
                            <Select
                                value={formData?.is_negotiable ? "true" : "false"}
                                onValueChange={(value) => handleInputChange("is_negotiable", value === "true")}
                                disabled={!editMode || isLoadingOptions}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {fieldOptions?.is_negotiable?.map((item: [string, string]) => (
                                        <SelectItem key={item[0]} value={item[0]}>
                                            {item[1]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Sale Prices */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormFieldInput
                            label="قیمت کل (فروش)"
                            id="price"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.price ?? ""}
                            onChange={handleNumericChange("price")}
                            error={errors?.price}
                        />
                        <FormFieldInput
                            label="قیمت حراج (تخفیف‌دار)"
                            id="sale_price"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.sale_price ?? ""}
                            onChange={handleNumericChange("sale_price")}
                            error={errors?.sale_price}
                        />
                        <FormFieldInput
                            label="قیمت پیش‌فروش"
                            id="pre_sale_price"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.pre_sale_price ?? ""}
                            onChange={handleNumericChange("pre_sale_price")}
                            error={errors?.pre_sale_price}
                        />
                    </div>

                    {/* Price per SQM (calculated) */}
                    <FormFieldInput
                        label="قیمت متری (محاسبه خودکار)"
                        id="price_per_sqm"
                        type="number"
                        disabled={true}
                        value={formData?.price && formData?.built_area ? Math.round(Number(formData.price) / Number(formData.built_area)) : ""}
                        placeholder="-"
                        className="bg-muted/50"
                    />

                    {/* Rental Prices */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormFieldInput
                            label="مبلغ رهن (اجاره)"
                            id="mortgage_amount"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.mortgage_amount ?? ""}
                            onChange={handleNumericChange("mortgage_amount")}
                            error={errors?.mortgage_amount}
                        />
                        <FormFieldInput
                            label="اجاره ماهیانه"
                            id="rent_amount"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.rent_amount ?? ""}
                            onChange={handleNumericChange("rent_amount")}
                            error={errors?.rent_amount}
                        />
                    </div>

                    {/* Additional Rental Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormFieldInput
                            label="اجاره ماهیانه (مدت‌دار)"
                            id="monthly_rent"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.monthly_rent ?? ""}
                            onChange={handleNumericChange("monthly_rent")}
                            error={errors?.monthly_rent}
                        />
                        <FormFieldInput
                            label="ودیعه (سپرده)"
                            id="security_deposit"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.security_deposit ?? ""}
                            onChange={handleNumericChange("security_deposit")}
                            error={errors?.security_deposit}
                        />
                    </div>
                </div>
            </CardWithIcon>
        </div>
    );
}
