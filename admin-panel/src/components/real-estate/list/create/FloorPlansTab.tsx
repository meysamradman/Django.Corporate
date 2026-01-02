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

interface FloorPlan {
  id?: number;
  title: string;
  slug: string;
  description: string;
  floor_size: number | null;
  size_unit: "sqft" | "sqm";
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

  // سَنکرون کردن با tempFloorPlans
  useEffect(() => {
    if (!propertyId && tempFloorPlans) {
      setFloorPlans(tempFloorPlans);
    }
  }, [tempFloorPlans, propertyId]);

  // Load floor plans if editing
  useEffect(() => {
    if (propertyId && editMode) {
      loadFloorPlans();
    }
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

    if (!propertyId) {
      showError("ابتدا باید ملک را ذخیره کنید");
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare data
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
      };

      // Add image IDs if selected
      if (selectedImages.length > 0) {
        floorPlanData.image_ids = selectedImages.map(img => img.id);
      }

      // Create floor plan via API
      const savedPlan = await realEstateApi.createFloorPlan(floorPlanData);
      
      // Add to local state
      setFloorPlans(prev => [...prev, savedPlan]);
      
      showSuccess("پلان با موفقیت اضافه شد");
      
      // Reset form
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
    } catch (error) {
      console.error("Error saving floor plan:", error);
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFloorPlan = async (id: number) => {
    if (!confirm("آیا از حذف این پلان اطمینان دارید؟")) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Call API to delete
      if (propertyId) {
        await realEstateApi.deleteFloorPlan(id);
      }
      
      // Remove from local state
      const updatedPlans = floorPlans.filter(plan => plan.id !== id);
      setFloorPlans(updatedPlans);
      
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
      // Auto-generate slug from title
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
          {!propertyId && floorPlans.length === 0 && (
            <div className="flex items-start gap-3 p-4 bg-blue/10 border border-blue-1 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                <Home className="h-5 w-5 text-blue-1" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-tx-1">
                  افزودن پلان‌ها در حالت ایجاد
                </p>
                <p className="text-xs text-tx-2">
                  می‌توانید پلان‌های طبقات را اضافه کنید. این پلان‌ها به صورت موقت ذخیره شده و پس از ذخیره ملک به آن اضافه خواهند شد.
                </p>
              </div>
            </div>
          )}

          {/* Existing Floor Plans */}
          {floorPlans.length > 0 && (
            <div className="space-y-4">
              {floorPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-br rounded-lg p-4 hover:border-blue-1 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <h4 className="font-medium text-tx-1 text-lg">{plan.title}</h4>
                      
                      {/* Floor Plan Details with Icons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Size */}
                        <div className="flex items-center gap-2 text-sm text-tx-2">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue/10 rounded-full flex items-center justify-center">
                            <Maximize2 className="h-4 w-4 text-blue-1" />
                          </div>
                          <div>
                            <p className="text-xs text-tx-3">مساحت</p>
                            <p className="font-medium text-tx-1">
                              {plan.floor_size} {plan.size_unit === "sqm" ? "متر مربع" : "فوت مربع"}
                            </p>
                          </div>
                        </div>

                        {/* Bedrooms */}
                        {plan.bedrooms !== null && (
                          <div className="flex items-center gap-2 text-sm text-tx-2">
                            <div className="flex-shrink-0 w-8 h-8 bg-green/10 rounded-full flex items-center justify-center">
                              <Bed className="h-4 w-4 text-green-1" />
                            </div>
                            <div>
                              <p className="text-xs text-tx-3">اتاق خواب</p>
                              <p className="font-medium text-tx-1">{plan.bedrooms} اتاق</p>
                            </div>
                          </div>
                        )}

                        {/* Bathrooms */}
                        {plan.bathrooms !== null && (
                          <div className="flex items-center gap-2 text-sm text-tx-2">
                            <div className="flex-shrink-0 w-8 h-8 bg-teal-0 rounded-full flex items-center justify-center">
                              <Bath className="h-4 w-4 text-teal-1" />
                            </div>
                            <div>
                              <p className="text-xs text-tx-3">سرویس بهداشتی</p>
                              <p className="font-medium text-tx-1">{plan.bathrooms} سرویس</p>
                            </div>
                          </div>
                        )}

                        {/* Price */}
                        {plan.price !== null && (
                          <div className="flex items-center gap-2 text-sm text-tx-2">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange/10 rounded-full flex items-center justify-center">
                              <DollarSign className="h-4 w-4 text-orange-1" />
                            </div>
                            <div>
                              <p className="text-xs text-tx-3">قیمت</p>
                              <p className="font-medium text-tx-1">
                                {plan.price.toLocaleString()} {plan.currency}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      {(plan.floor_number !== null || plan.unit_type) && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {plan.floor_number !== null && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-bg rounded text-xs text-tx-2">
                              <span className="font-medium">طبقه:</span> {plan.floor_number}
                            </span>
                          )}
                          {plan.unit_type && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-bg rounded text-xs text-tx-2">
                              <span className="font-medium">نوع:</span> {plan.unit_type}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteFloorPlan(plan.id!)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Floor Plan Form */}
          {isAdding ? (
            <div className="border border-blue-1 rounded-lg p-6 bg-blue/5 space-y-6">
              <h4 className="font-medium text-tx-1 mb-4">افزودن پلان جدید</h4>
              
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
                  label="مساحت *"
                  id="floor_plan_size"
                  value={newFloorPlan.floor_size || ""}
                  onChange={handleInputChange("floor_size")}
                  placeholder="مثلاً: 120"
                  required
                />

                <div className="space-y-2">
                  <Label htmlFor="size_unit">واحد اندازه</Label>
                  <Select
                    value={newFloorPlan.size_unit}
                    onValueChange={handleSelectChange("size_unit")}
                  >
                    <SelectTrigger>
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
                  value={newFloorPlan.floor_number || ""}
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

              {/* Image Management Section with MediaGallery */}
              <div className="space-y-4 pt-4 border-t border-br">
                <MediaGallery
                  mediaItems={selectedImages}
                  onMediaSelect={handleMediaSelect}
                  mediaType="image"
                  title="تصاویر پلان (نقشه، رندر 3D)"
                  isGallery={true}
                  context="media_library"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-br">
                <Button
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                  disabled={isLoading}
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleSaveFloorPlan}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    "ذخیره پلان"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleAddFloorPlan}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              افزودن پلان جدید
            </Button>
          )}
        </div>
      </CardWithIcon>
    </div>
  );
}
