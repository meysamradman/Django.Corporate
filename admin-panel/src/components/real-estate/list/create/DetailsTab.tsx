import { ChangeEvent } from "react";
import { FormFieldInput } from "@/components/forms/FormField";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Home, DollarSign, Car, Box } from "lucide-react";

interface DetailsTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    errors?: Record<string, string>;
}

export default function DetailsTab({ formData, handleInputChange, editMode, errors }: DetailsTabProps) {
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
                    <FormFieldInput
                        label="تعداد خواب"
                        id="bedrooms"
                        type="number"
                        placeholder="0"
                        disabled={!editMode}
                        value={formData?.bedrooms ?? ""}
                        onChange={handleNumericChange("bedrooms")}
                        error={errors?.bedrooms}
                    />
                    <FormFieldInput
                        label="تعداد سرویس/حمام"
                        id="bathrooms"
                        type="number"
                        placeholder="0"
                        disabled={!editMode}
                        value={formData?.bathrooms ?? ""}
                        onChange={handleNumericChange("bathrooms")}
                        error={errors?.bathrooms}
                    />
                    <FormFieldInput
                        label="سال ساخت"
                        id="year_built"
                        type="number"
                        placeholder="1402"
                        disabled={!editMode}
                        value={formData?.year_built ?? ""}
                        onChange={handleNumericChange("year_built")}
                        error={errors?.year_built}
                    />
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
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <FormFieldInput
                                label="پارکینگ"
                                id="parking_spaces"
                                type="number"
                                placeholder="0"
                                disabled={!editMode}
                                value={formData?.parking_spaces ?? ""}
                                onChange={handleNumericChange("parking_spaces")}
                                error={errors?.parking_spaces}
                                icon={<Car className="w-4 h-4 text-muted-foreground" />}
                            />
                        </div>
                        <div className="flex-1">
                            <FormFieldInput
                                label="انباری"
                                id="storage_rooms"
                                type="number"
                                placeholder="0"
                                disabled={!editMode}
                                value={formData?.storage_rooms ?? ""}
                                onChange={handleNumericChange("storage_rooms")}
                                error={errors?.storage_rooms}
                                icon={<Box className="w-4 h-4 text-muted-foreground" />}
                            />
                        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        label="قیمت متری (محاسبه خودکار)"
                        id="price_per_sqm"
                        type="number"
                        disabled={true}
                        value={formData?.price && formData?.built_area ? Math.round(Number(formData.price) / Number(formData.built_area)) : ""}
                        placeholder="-"
                        className="bg-muted/50"
                    />
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
            </CardWithIcon>
        </div>
    );
}
