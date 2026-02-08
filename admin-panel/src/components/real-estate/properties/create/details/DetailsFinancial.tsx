import { FormFieldInput } from "@/components/shared/FormField";
import { Info } from "lucide-react";

interface DetailsFinancialProps {
    formData: any;
    editMode: boolean;
    errors?: Record<string, string>;
    handleNumericChange: (field: string) => (e: any) => void;
}

export function DetailsFinancial({
    formData,
    editMode,
    errors,
    handleNumericChange
}: DetailsFinancialProps) {
    return (
        <div className="space-y-8">
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
                    className="border-orange-1/50"
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
                    className="border-blue-1/50"
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
                <FormFieldInput
                    label="ودیعه ثانویه"
                    id="security_deposit"
                    type="number"
                    placeholder="0"
                    disabled={!editMode}
                    value={formData?.security_deposit ?? ""}
                    onChange={handleNumericChange("security_deposit")}
                    error={errors?.security_deposit}
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
                />
            </div>
        </div>
    );
}
