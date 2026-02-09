
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Label } from "@/components/elements/Label";
import { Plus, Loader2 } from "lucide-react";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import type { Media } from "@/types/shared/media";

interface FloorPlan {
    id?: number;
    title: string;
    slug: string;
    description: string;
    floor_size: number | null;
    size_unit: "sqm" | "sqft";
    bedrooms: number | null;
    bathrooms: number | null;
    price: number | null;
    currency: string;
    floor_number: number | null;
    unit_type: string;
    display_order: number;
    is_available: boolean;
    images: any[];
}

interface RealEstateFloorPlanFormProps {
    plan: FloorPlan;
    editingPlanId: number | null;
    isLoading: boolean;
    onCancel: () => void;
    onSave: () => void;
    onInputChange: (field: keyof FloorPlan) => (e: any) => void;
    onSelectChange: (field: keyof FloorPlan) => (value: string) => void;
    onMediaSelect: (media: Media[]) => void;
    selectedImages: Media[];
}

export function RealEstateFloorPlanForm({
    plan,
    editingPlanId,
    isLoading,
    onCancel,
    onSave,
    onInputChange,
    onSelectChange,
    onMediaSelect,
    selectedImages
}: RealEstateFloorPlanFormProps) {
    return (
        <div className="border border-indigo-1/20 rounded-2xl p-6 bg-indigo-0/5 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between gap-4 mb-2">
                <h4 className="font-black text-font-p flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-1" />
                    {editingPlanId ? "ویرایش و تغییر پلان" : "افزودن پلان جدید"}
                </h4>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="h-8 text-[11px] font-bold text-font-s hover:text-red-1 border-none hover:bg-red-0"
                >
                    انصراف
                </Button>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo shadow-glow" />
                <span className="text-xs font-bold text-indigo tracking-tight">
                    {editingPlanId ? "ویرایش اطلاعات پلان" : "ثبت اطلاعات جدید"}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormFieldInput
                    label="عنوان پلان"
                    id="floor_plan_title"
                    value={plan.title}
                    onChange={onInputChange("title")}
                    placeholder="مثلاً: طبقه اول - نوع A"
                    required
                />

                <FormFieldInput
                    label="نوع واحد"
                    id="floor_plan_unit_type"
                    value={plan.unit_type}
                    onChange={onInputChange("unit_type")}
                    placeholder="مثلاً: Type A, VIP"
                />
            </div>

            <FormFieldTextarea
                label="توضیحات"
                id="floor_plan_description"
                value={plan.description}
                onChange={onInputChange("description")}
                placeholder="توضیحات تکمیلی درباره این پلان..."
                rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormFieldInput
                    type="number"
                    label="مساحت"
                    id="floor_plan_size"
                    value={plan.floor_size || ""}
                    onChange={onInputChange("floor_size")}
                    placeholder="مثلاً: 120"
                    required
                />

                <div className="space-y-2">
                    <Label htmlFor="size_unit" className="text-xs font-bold text-font-s/70">واحد اندازه</Label>
                    <Select
                        value={plan.size_unit}
                        onValueChange={onSelectChange("size_unit")}
                    >
                        <SelectTrigger className="w-full h-11 border-br bg-wt focus:ring-indigo/20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sqm">متر مربع</SelectItem>
                            <SelectItem value="sqft">فوت مربع</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <FormFieldInput
                    type="number"
                    label="شماره طبقه"
                    id="floor_plan_number"
                    value={plan.floor_number !== null ? plan.floor_number : ""}
                    onChange={onInputChange("floor_number")}
                    placeholder="مثلاً: 1"
                />

                <FormFieldInput
                    type="number"
                    label="تعداد اتاق خواب"
                    id="floor_plan_bedrooms"
                    value={plan.bedrooms || ""}
                    onChange={onInputChange("bedrooms")}
                    placeholder="مثلاً: 3"
                />

                <FormFieldInput
                    type="number"
                    label="تعداد سرویس بهداشتی"
                    id="floor_plan_bathrooms"
                    value={plan.bathrooms || ""}
                    onChange={onInputChange("bathrooms")}
                    placeholder="مثلاً: 2"
                />

                <FormFieldInput
                    type="number"
                    label="قیمت"
                    id="floor_plan_price"
                    value={plan.price || ""}
                    onChange={onInputChange("price")}
                    placeholder="مثلاً: 5000000000"
                />
            </div>

            <div className="space-y-4 pt-6 border-t border-br">
                <MediaGallery
                    mediaItems={selectedImages}
                    onMediaSelect={onMediaSelect}
                    mediaType="image"
                    title="تصاویر پلان (نقشه، رندر 3D)"
                    isGallery={true}
                    context="media_library"
                />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-br">
                <Button variant="outline" onClick={onCancel} disabled={isLoading} className="h-11 px-6 font-bold text-font-s">
                    انصراف
                </Button>
                <Button onClick={onSave} disabled={isLoading} className="h-11 px-8 font-black">
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> در حال ذخیره...</> : (editingPlanId ? "تایید و بروزرسانی" : "ذخیره و ثبت نهایی")}
                </Button>
            </div>
        </div>
    );
}
