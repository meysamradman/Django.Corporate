import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Label } from "@/components/elements/Label";
import { Home, Plus, Trash2, Loader2, Maximize2, Bed, Bath, DollarSign } from "lucide-react";
import { showError, showSuccess } from "@/core/toast";
import { realEstateApi } from "@/api/real-estate";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import type { Media } from "@/types/shared/media";
import { generateSlug } from "@/core/slug/generate";
import { mediaService } from "@/components/media/services";

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

interface FloorPlansTabProps {
  propertyId?: number;
  editMode?: boolean;
  tempFloorPlans?: FloorPlan[];
  onTempFloorPlansChange?: (plans: FloorPlan[]) => void;
}

export default function FloorPlansTab({
  propertyId,
  editMode,
  tempFloorPlans = [],
  onTempFloorPlansChange
}: FloorPlansTabProps) {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(tempFloorPlans);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newFloorPlan, setNewFloorPlan] = useState<FloorPlan>({
    title: "",
    slug: "",
    description: "",
    floor_size: null,
    size_unit: "sqm",
    bedrooms: null,
    bathrooms: null,
    price: null,
    currency: "IRR",
    floor_number: null,
    unit_type: "",
    display_order: 0,
    is_available: true,
    images: [],
  });

  // Media state for new floor plan
  const [selectedImages, setSelectedImages] = useState<Media[]>([]);

  // Sync with tempFloorPlans
  useEffect(() => {
    if (!propertyId && tempFloorPlans) {
      setFloorPlans(tempFloorPlans);
    }
  }, [tempFloorPlans, propertyId]);

  // Sync with parent state whenever floorPlans changes (for create mode)
  useEffect(() => {
    if (!propertyId && onTempFloorPlansChange) {
      onTempFloorPlansChange(floorPlans);
    }
  }, [floorPlans, propertyId, onTempFloorPlansChange]);

  // Load floor plans if editing
  useEffect(() => {
    if (propertyId && editMode) {
      loadFloorPlans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, editMode]);

  const loadFloorPlans = async () => {
    if (!propertyId) return;

    try {
      setIsLoading(true);
      const plans = await realEstateApi.getFloorPlans(propertyId);
      setFloorPlans(plans || []);
    } catch (error) {
      console.error("Error loading floor plans:", error);
      showError("خطا در بارگذاری پلان‌های طبقات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFloorPlan = () => {
    setIsAdding(true);
  };

  const handleSaveFloorPlan = async () => {
    if (!newFloorPlan.title.trim()) {
      showError("عنوان پلان الزامی است");
      return;
    }

    if (!newFloorPlan.floor_size || newFloorPlan.floor_size <= 0) {
      showError("مساحت پلان الزامی است");
      return;
    }

    // In create mode (no propertyId), we just add to the local list
    if (!propertyId) {
      const tempId = floorPlans.length + 1;
      const planWithImages = {
        ...newFloorPlan,
        id: -tempId, // Temporary ID for local identification
        images: selectedImages
      };
      setFloorPlans(prev => [...prev, planWithImages]);
      showSuccess("پلان موقت اضافه شد");
      resetForm();
      return;
    }

    try {
      setIsLoading(true);

      const floorPlanData: any = {
        property_obj: propertyId,
        title: newFloorPlan.title,
        slug: newFloorPlan.slug || generateSlug(newFloorPlan.title),
        description: newFloorPlan.description,
        floor_size: newFloorPlan.floor_size,
        size_unit: newFloorPlan.size_unit,
        bedrooms: newFloorPlan.bedrooms,
        bathrooms: newFloorPlan.bathrooms,
        price: newFloorPlan.price,
        currency: newFloorPlan.currency,
        floor_number: newFloorPlan.floor_number,
        unit_type: newFloorPlan.unit_type,
        display_order: newFloorPlan.display_order,
        is_available: newFloorPlan.is_available,
        image_ids: selectedImages.map(img => img.id)
      };

      const savedPlan = await realEstateApi.createFloorPlan(floorPlanData);
      setFloorPlans(prev => [...prev, savedPlan]);
      showSuccess("پلان با موفقیت اضافه شد");
      resetForm();
    } catch (error) {
      console.error("Error saving floor plan:", error);
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setSelectedImages([]);
    setNewFloorPlan({
      title: "",
      slug: "",
      description: "",
      floor_size: null,
      size_unit: "sqm",
      bedrooms: null,
      bathrooms: null,
      price: null,
      currency: "IRR",
      floor_number: null,
      unit_type: "",
      display_order: floorPlans.length,
      is_available: true,
      images: [],
    });
  };

  const handleDeleteFloorPlan = async (id: number) => {
    if (!confirm("آیا از حذف این پلان اطمینان دارید؟")) {
      return;
    }

    // Handle temporary plan deletion (negative IDs)
    if (id < 0) {
      setFloorPlans(prev => prev.filter(p => p.id !== id));
      showSuccess("پلان موقت حذف شد");
      return;
    }

    try {
      setIsLoading(true);
      if (propertyId) {
        await realEstateApi.deleteFloorPlan(id);
      }
      setFloorPlans(prev => prev.filter(plan => plan.id !== id));
      showSuccess("پلان با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting floor plan:", error);
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FloorPlan) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (field === "floor_size" || field === "bedrooms" || field === "bathrooms" || field === "price" || field === "floor_number") {
      setNewFloorPlan(prev => ({ ...prev, [field]: value ? Number(value) : null }));
    } else if (field === "title") {
      const slug = generateSlug(value);
      setNewFloorPlan(prev => ({ ...prev, title: value, slug }));
    } else {
      setNewFloorPlan(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSelectChange = (field: keyof FloorPlan) => (value: string) => {
    setNewFloorPlan(prev => ({ ...prev, [field]: value }));
  };

  const handleMediaSelect = (media: Media[]) => {
    setSelectedImages(media);
  };

  if (!editMode) {
    return (
      <div className="mt-0">
        <CardWithIcon
          icon={Home}
          title="پلان‌های طبقات"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="text-center py-8 text-tx-2">
            مشاهده پلان‌ها
          </div>
        </CardWithIcon>
      </div>
    );
  }

  return (
    <div className="mt-0 space-y-6">
      <CardWithIcon
        icon={Home}
        title="پلان‌های طبقات"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
      >
        <div className="space-y-6">
          {/* Header Info for empty state */}
          {!propertyId && floorPlans.length === 0 && !isAdding && (
            <div className="flex items-start gap-4 p-5 bg-indigo-0/30 border border-indigo-1/10 rounded-2xl">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo rounded-xl flex items-center justify-center shadow-lg shadow-indigo/20">
                <Home className="h-5 w-5 text-static-w" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold text-font-p">
                  افزودن پلان‌های ملک
                </p>
                <p className="text-[11px] text-font-s/70 leading-relaxed">
                  در این بخش می‌توانید نقشه‌ها، رندرهای سه بعدی و مشخصات هر واحد یا طبقه را به صورت مجزا ثبت کنید.
                </p>
              </div>
            </div>
          )}

          {/* ADD ACTION / FORM SECTION */}
          {isAdding ? (
            <div className="border border-indigo-1/20 rounded-2xl p-6 bg-indigo-0/5 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h4 className="font-black text-font-p flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-1" />
                  افزودن پلان جدید
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="h-8 text-[11px] font-bold text-font-s hover:text-red-1 border-none hover:bg-red-0"
                >
                  انصراف
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormFieldInput
                  label="عنوان پلان"
                  id="floor_plan_title"
                  value={newFloorPlan.title}
                  onChange={handleInputChange("title")}
                  placeholder="مثلاً: طبقه اول - نوع A"
                  required
                />

                <FormFieldInput
                  label="نوع واحد"
                  id="floor_plan_unit_type"
                  value={newFloorPlan.unit_type}
                  onChange={handleInputChange("unit_type")}
                  placeholder="مثلاً: Type A, VIP"
                />
              </div>

              <FormFieldTextarea
                label="توضیحات"
                id="floor_plan_description"
                value={newFloorPlan.description}
                onChange={handleInputChange("description")}
                placeholder="توضیحات تکمیلی درباره این پلان..."
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormFieldInput
                  type="number"
                  label="مساحت"
                  id="floor_plan_size"
                  value={newFloorPlan.floor_size || ""}
                  onChange={handleInputChange("floor_size")}
                  placeholder="مثلاً: 120"
                  required
                />

                <div className="space-y-2">
                  <Label htmlFor="size_unit" className="text-xs font-bold text-font-s/70">واحد اندازه</Label>
                  <Select
                    value={newFloorPlan.size_unit}
                    onValueChange={handleSelectChange("size_unit")}
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
                  value={newFloorPlan.floor_number !== null ? newFloorPlan.floor_number : ""}
                  onChange={handleInputChange("floor_number")}
                  placeholder="مثلاً: 1"
                />

                <FormFieldInput
                  type="number"
                  label="تعداد اتاق خواب"
                  id="floor_plan_bedrooms"
                  value={newFloorPlan.bedrooms || ""}
                  onChange={handleInputChange("bedrooms")}
                  placeholder="مثلاً: 3"
                />

                <FormFieldInput
                  type="number"
                  label="تعداد سرویس بهداشتی"
                  id="floor_plan_bathrooms"
                  value={newFloorPlan.bathrooms || ""}
                  onChange={handleInputChange("bathrooms")}
                  placeholder="مثلاً: 2"
                />

                <FormFieldInput
                  type="number"
                  label="قیمت"
                  id="floor_plan_price"
                  value={newFloorPlan.price || ""}
                  onChange={handleInputChange("price")}
                  placeholder="مثلاً: 5000000000"
                />
              </div>

              <div className="space-y-4 pt-6 border-t border-br">
                <MediaGallery
                  mediaItems={selectedImages}
                  onMediaSelect={handleMediaSelect}
                  mediaType="image"
                  title="تصاویر پلان (نقشه، رندر 3D)"
                  isGallery={true}
                  context="media_library"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-br">
                <Button variant="outline" onClick={() => setIsAdding(false)} disabled={isLoading} className="h-11 px-6 font-bold text-font-s">
                  انصراف
                </Button>
                <Button onClick={handleSaveFloorPlan} disabled={isLoading} className="h-11 px-8 font-black">
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> در حال ذخیره...</> : "ذخیره و ثبت پلان"}
                </Button>
              </div>
            </div>
          ) : (
            <div onClick={handleAddFloorPlan} className="group cursor-pointer relative overflow-hidden h-24 border-2 border-dashed border-br rounded-2xl flex items-center justify-center bg-wt hover:bg-indigo-0/5 hover:border-indigo-1/30 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-0/0 via-indigo-0/5 to-indigo-0/0 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
              <div className="flex flex-col items-center gap-1 relative z-10">
                <div className="w-10 h-10 rounded-full bg-indigo-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-6 h-6 text-indigo-1" />
                </div>
                <span className="text-[11px] font-black text-font-p tracking-tight">افزودن پلان جدید</span>
              </div>
            </div>
          )}

          {/* Existing Floor Plans */}
          {floorPlans.length > 0 && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-3 mb-2 px-1">
                <div className="w-2 h-2 rounded-full bg-indigo shadow-glow" />
                <h5 className="text-[11px] font-black uppercase tracking-widest text-font-s opacity-60">پلان‌های ثبت شده</h5>
              </div>
              {floorPlans.map((plan, index) => (
                <div key={plan.id || `temp-${index}`} className="relative border border-br rounded-2xl p-5 bg-wt hover:border-indigo-1/20 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row items-start gap-6">
                    {/* Visual Preview (if images exist) */}
                    {plan.images && plan.images.length > 0 && (
                      <div className="w-full lg:w-48 aspect-[4/3] rounded-xl overflow-hidden border border-br bg-muted/5 flex-shrink-0">
                        <img src={mediaService.getMediaUrlFromObject(plan.images[0])} alt={plan.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="font-black text-font-p text-xl truncate">{plan.title}</h4>
                          <p className="text-[11px] text-font-s/60 line-clamp-1 mt-1 font-medium">{plan.description}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteFloorPlan(plan.id!)} className="h-9 w-9 p-0 text-red-1 border-none hover:bg-red-0 hover:text-red-1 rounded-xl shadow-sm transition-all duration-300" disabled={!editMode}>
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>

                      {/* Floor Plan Details - NEUTRAL STYLING */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Size */}
                        <div className="bg-bg p-3 rounded-2xl border border-br/50 group/detail transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-wt rounded-xl flex items-center justify-center border border-br/30 shadow-sm">
                              <Maximize2 className="h-4.5 w-4.5 text-font-s" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-font-s/40 uppercase tracking-tighter">مساحت</p>
                              <p className="font-bold text-font-p text-sm">
                                {plan.floor_size} {plan.size_unit === "sqm" ? "متر" : "فوت"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bedrooms */}
                        {plan.bedrooms !== null && (
                          <div className="bg-bg p-3 rounded-2xl border border-br/50 group/detail transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-wt rounded-xl flex items-center justify-center border border-br/30 shadow-sm">
                                <Bed className="h-4.5 w-4.5 text-font-s" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-font-s/40 uppercase tracking-tighter">اتاق خواب</p>
                                <p className="font-bold text-font-p text-sm">{plan.bedrooms} اتاق</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bathrooms */}
                        {plan.bathrooms !== null && (
                          <div className="bg-bg p-3 rounded-2xl border border-br/50 group/detail transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-wt rounded-xl flex items-center justify-center border border-br/30 shadow-sm">
                                <Bath className="h-4.5 w-4.5 text-font-s" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-font-s/40 uppercase tracking-tighter">سرویس</p>
                                <p className="font-bold text-font-p text-sm">{plan.bathrooms} مورد</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Price */}
                        {plan.price !== null && (
                          <div className="bg-bg p-3 rounded-2xl border border-br/50 group/detail transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-wt rounded-xl flex items-center justify-center border border-br/30 shadow-sm">
                                <DollarSign className="h-4.5 w-4.5 text-font-s" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-font-s/40 uppercase tracking-tighter">قیمت</p>
                                <p className="font-bold text-font-p text-sm truncate">
                                  {plan.price.toLocaleString()} {plan.currency}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Badges info */}
                      {(plan.floor_number !== null || plan.unit_type) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {plan.floor_number !== null && (
                            <span className="inline-flex items-center px-3 py-1.5 bg-muted/10 rounded-full text-xs font-bold text-font-s border border-br">
                              <span className="opacity-50 ml-1">طبقه:</span> {plan.floor_number}
                            </span>
                          )}
                          {plan.unit_type && (
                            <span className="inline-flex items-center px-3 py-1.5 bg-bg rounded-full text-xs font-bold text-font-s border border-br">
                              <span className="opacity-50 ml-1">نوع واحد:</span> {plan.unit_type}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardWithIcon>
    </div>
  );
}
