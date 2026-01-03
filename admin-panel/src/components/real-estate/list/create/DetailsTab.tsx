import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { FormFieldInput } from "@/components/forms/FormField";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Home, DollarSign, Car, Box, Info, Layers, Key, Utensils, Sofa } from "lucide-react";
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
        <div className="space-y-8 pb-10">
            {/* Physical Attributes Card */}
            <CardWithIcon
                icon={Layers}
                title="مشخصات فیزیکی و ابعاد"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
            >
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
                        className="h-11"
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
                        className="h-11"
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
                            className="h-11"
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
                        className="h-11"
                    />

                    <div className="space-y-2">
                        <Label htmlFor="floor_number">طبقه ملک</Label>
                        <Select
                            value={formData?.floor_number?.toString() || undefined}
                            onValueChange={handleSelectChange("floor_number")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger className="w-full h-11 border-br bg-wt">
                                <SelectValue placeholder="انتخاب طبقه" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.floor_number?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
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
                            <SelectTrigger className="w-full h-11 border-br bg-wt">
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
            </CardWithIcon>

            {/* Rooms and Facilities Card */}
            <CardWithIcon
                icon={Home}
                title="امکانات و فضاها"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Bedrooms */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Key className="w-4 h-4 text-purple-2" />
                            <Label htmlFor="bedrooms" className="font-bold">تعداد خواب *</Label>
                        </div>
                        <Select
                            value={formData?.bedrooms?.toString() || undefined}
                            onValueChange={handleSelectChange("bedrooms")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger className="w-full h-11 border-br bg-wt">
                                <SelectValue placeholder="انتخاب تعداد خواب" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.bedrooms?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.bedrooms && <p className="text-xs text-red-1">{errors.bedrooms}</p>}
                    </div>

                    {/* Bathrooms */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Box className="w-4 h-4 text-purple-2" />
                            <Label htmlFor="bathrooms" className="font-bold">تعداد سرویس *</Label>
                        </div>
                        <Select
                            value={formData?.bathrooms?.toString() || undefined}
                            onValueChange={handleSelectChange("bathrooms")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger className="w-full h-11 border-br bg-wt">
                                <SelectValue placeholder="انتخاب تعداد سرویس" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.bathrooms?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.bathrooms && <p className="text-xs text-red-1">{errors.bathrooms}</p>}
                    </div>

                    {/* Parking */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Car className="w-4 h-4 text-purple-2" />
                            <Label htmlFor="parking_spaces" className="font-bold">پارکینگ</Label>
                        </div>
                        <Select
                            value={formData?.parking_spaces?.toString() || undefined}
                            onValueChange={handleSelectChange("parking_spaces")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger className="w-full h-11 border-br bg-wt">
                                <SelectValue placeholder="تعداد پارکینگ" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.parking_spaces?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.parking_spaces && <p className="text-xs text-red-1">{errors.parking_spaces}</p>}
                    </div>

                    {/* Storage */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Box className="w-4 h-4 text-purple-2" />
                            <Label htmlFor="storage_rooms" className="font-bold">انباری</Label>
                        </div>
                        <Select
                            value={formData?.storage_rooms?.toString() || undefined}
                            onValueChange={handleSelectChange("storage_rooms")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger className="w-full h-11 border-br bg-wt">
                                <SelectValue placeholder="تعداد انباری" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.storage_rooms?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.storage_rooms && <p className="text-xs text-red-1">{errors.storage_rooms}</p>}
                    </div>

                    {/* Kitchens */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Utensils className="w-4 h-4 text-purple-2" />
                            <Label htmlFor="kitchens" className="font-bold">آشپزخانه</Label>
                        </div>
                        <Select
                            value={formData?.kitchens?.toString() || undefined}
                            onValueChange={handleSelectChange("kitchens")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger className="w-full h-11 border-br bg-wt">
                                <SelectValue placeholder="تعداد آشپزخانه" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.kitchens?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Living Rooms */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Sofa className="w-4 h-4 text-purple-2" />
                            <Label htmlFor="living_rooms" className="font-bold">پذیرایی</Label>
                        </div>
                        <Select
                            value={formData?.living_rooms?.toString() || undefined}
                            onValueChange={handleSelectChange("living_rooms")}
                            disabled={!editMode || isLoadingOptions}
                        >
                            <SelectTrigger className="w-full h-11 border-br bg-wt">
                                <SelectValue placeholder="تعداد پذیرایی" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions?.living_rooms?.map((item: [number, string]) => (
                                    <SelectItem key={item[0]} value={item[0].toString()}>
                                        {item[1]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardWithIcon>

            {/* Price and Conditions Card */}
            <CardWithIcon
                icon={DollarSign}
                title="قیمت و شرایط مالی"
                iconBgColor="bg-green"
                iconColor="stroke-green-2"
                borderColor="border-b-green-1"
            >
                <div className="space-y-8">
                    {/* Sale Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormFieldInput
                            label="قیمت پکیج / کل (فروش)"
                            id="price"
                            type="number"
                            placeholder="مثلاً: 5000000000"
                            disabled={!editMode}
                            value={formData?.price ?? ""}
                            onChange={handleNumericChange("price")}
                            error={errors?.price}
                            className="h-11"
                        />
                        <FormFieldInput
                            label="قیمت ویژه / حراج"
                            id="sale_price"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.sale_price ?? ""}
                            onChange={handleNumericChange("sale_price")}
                            error={errors?.sale_price}
                            className="h-11 border-orange-1/50"
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
                            className="h-11 border-blue-1/50"
                        />
                    </div>

                    <div className="bg-bg/50 p-4 rounded-xl border border-br/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-font-s opacity-60" />
                            <span className="text-xs text-font-s font-medium">قیمت متری (محاسبه خودکار):</span>
                        </div>
                        <span className="text-sm font-black text-font-p">
                            {formData?.price && formData?.built_area
                                ? (Math.round(Number(formData.price) / Number(formData.built_area))).toLocaleString() + " IRR"
                                : "-"
                            }
                        </span>
                    </div>

                    <div className="h-px bg-br/50 w-full" />

                    {/* Rental Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormFieldInput
                            label="مبلغ رهن / ودیعه"
                            id="mortgage_amount"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.mortgage_amount ?? ""}
                            onChange={handleNumericChange("mortgage_amount")}
                            error={errors?.mortgage_amount}
                            className="h-11"
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
                            className="h-11"
                        />
                        <FormFieldInput
                            label="ودیعه ثانویه"
                            id="security_deposit"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.security_deposit ?? ""}
                            onChange={handleNumericChange("security_deposit")}
                            error={errors?.security_deposit}
                            className="h-11"
                        />
                        <FormFieldInput
                            label="اجاره (کوتاه‌مدت)"
                            id="monthly_rent"
                            type="number"
                            placeholder="0"
                            disabled={!editMode}
                            value={formData?.monthly_rent ?? ""}
                            onChange={handleNumericChange("monthly_rent")}
                            error={errors?.monthly_rent}
                            className="h-11"
                        />
                    </div>
                </div>
            </CardWithIcon>
        </div>
    );
}
