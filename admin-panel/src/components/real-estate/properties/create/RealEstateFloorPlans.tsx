
import { useState, useEffect } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Home } from "lucide-react";
import { showError, showSuccess } from "@/core/toast";
import { realEstateApi } from "@/api/real-estate";
import type { Media } from "@/types/shared/media";
import type { EditableFloorPlan } from "@/types/real_estate/floorPlanForm";
import { generateSlug } from "@/core/slug/generate";
import { RealEstateFloorPlanList } from "./floor-plans/RealEstateFloorPlanList";
import { RealEstateFloorPlanForm } from "./floor-plans/RealEstateFloorPlanForm";

interface FloorPlansTabProps {
  propertyId?: number;
  editMode?: boolean;
  tempFloorPlans?: EditableFloorPlan[];
  onTempFloorPlansChange?: (plans: EditableFloorPlan[]) => void;
}

export default function RealEstateFloorPlans({
  propertyId,
  editMode,
  tempFloorPlans = [],
  onTempFloorPlansChange
}: FloorPlansTabProps) {
  const [floorPlans, setFloorPlans] = useState<EditableFloorPlan[]>(tempFloorPlans);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [newFloorPlan, setNewFloorPlan] = useState<EditableFloorPlan>({
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

  const [selectedImages, setSelectedImages] = useState<Media[]>([]);

  useEffect(() => {
    if (!propertyId && tempFloorPlans) {
      setFloorPlans(tempFloorPlans);
    }
  }, [tempFloorPlans, propertyId]);

  useEffect(() => {
    if (!propertyId && onTempFloorPlansChange) {
      onTempFloorPlansChange(floorPlans);
    }
  }, [floorPlans, propertyId, onTempFloorPlansChange]);

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
      showError("خطا در بارگذاری پلان‌های طبقات");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingPlanId(null);
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

  const handleSaveFloorPlan = async () => {
    if (!newFloorPlan.title.trim()) {
      showError("عنوان پلان الزامی است");
      return;
    }
    if (!newFloorPlan.floor_size || newFloorPlan.floor_size <= 0) {
      showError("مساحت پلان الزامی است");
      return;
    }

    const image_ids = selectedImages.map(img => img.id);

    if (!propertyId) {
      if (editingPlanId && editingPlanId < 0) {
        setFloorPlans(prev => prev.map(p => p.id === editingPlanId ? { ...newFloorPlan, id: editingPlanId, images: selectedImages } : p));
        showSuccess("پلان موقت بروزرسانی شد");
      } else {
        const tempId = floorPlans.length + 1;
        setFloorPlans(prev => [...prev, { ...newFloorPlan, id: -tempId, images: selectedImages }]);
        showSuccess("پلان موقت اضافه شد");
      }
      resetForm();
      return;
    }

    try {
      setIsLoading(true);
      const floorPlanData: any = {
        property_obj: propertyId,
        ...newFloorPlan,
        slug: newFloorPlan.slug || generateSlug(newFloorPlan.title),
        is_active: true,
        image_ids: image_ids
      };

      if (editingPlanId && editingPlanId > 0) {
        const updatedPlan = await realEstateApi.updateFloorPlan(editingPlanId, floorPlanData);
        setFloorPlans(prev => prev.map(p => p.id === editingPlanId ? updatedPlan : p));
        showSuccess("پلان با موفقیت بروزرسانی شد");
      } else {
        const savedPlan = await realEstateApi.createFloorPlan(floorPlanData);
        setFloorPlans(prev => [...prev, savedPlan]);
        showSuccess("پلان با موفقیت اضافه شد");
      }
      resetForm();
    } catch (error: any) {
      showError(error.response?.data?.metaData?.message || error.message || "خطا در ذخیره پلان");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFloorPlan = (plan: EditableFloorPlan) => {
    setEditingPlanId(plan.id || null);
    const extractedImages = (plan.images || []).map((img: any) => img.image && typeof img.image === 'object' ? img.image : img);
    setNewFloorPlan({ ...plan, images: extractedImages });
    setSelectedImages(extractedImages);
    setIsAdding(true);
  };

  const handleDeleteFloorPlan = async (id: number) => {
    if (!confirm("آیا از حذف این پلان اطمینان دارید؟")) return;
    if (id < 0) {
      setFloorPlans(prev => prev.filter(p => p.id !== id));
      showSuccess("پلان موقت حذف شد");
      return;
    }
    try {
      setIsLoading(true);
      if (propertyId) await realEstateApi.deleteFloorPlan(id);
      setFloorPlans(prev => prev.filter(plan => plan.id !== id));
      showSuccess("پلان با موفقیت حذف شد");
    } catch (error: any) {
      showError(error.response?.data?.metaData?.message || "خطا در حذف پلان");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof EditableFloorPlan) => (e: any) => {
    const value = e.target.value;
    if (["floor_size", "bedrooms", "bathrooms", "price", "floor_number"].includes(field as string)) {
      const numValue = value ? Number(value) : null;
      setNewFloorPlan(prev => ({ ...prev, [field]: (numValue !== null && numValue < 0 && field !== "floor_number") ? 0 : numValue }));
    } else if (field === "title") {
      setNewFloorPlan(prev => ({ ...prev, title: value, slug: generateSlug(value) }));
    } else {
      setNewFloorPlan(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="mt-0 space-y-6">
      <CardWithIcon icon={Home} title="پلان‌های طبقات" iconBgColor="bg-blue" iconColor="stroke-blue-2" cardBorderColor="border-b-blue-1">
        <div className="space-y-6">
          {isAdding ? (
            <RealEstateFloorPlanForm
              plan={newFloorPlan}
              editingPlanId={editingPlanId}
              isLoading={isLoading}
              onCancel={resetForm}
              onSave={handleSaveFloorPlan}
              onInputChange={handleInputChange}
              onSelectChange={(field) => (val) => setNewFloorPlan(prev => ({ ...prev, [field]: val }))}
              onMediaSelect={setSelectedImages}
              selectedImages={selectedImages}
            />
          ) : (
            <RealEstateFloorPlanList
              floorPlans={floorPlans}
              propertyId={propertyId}
              isAdding={isAdding}
              editMode={Boolean(editMode)}
              onAdd={() => { resetForm(); setIsAdding(true); }}
              onEdit={handleEditFloorPlan}
              onDelete={handleDeleteFloorPlan}
            />
          )}
        </div>
      </CardWithIcon>
    </div>
  );
}

export { RealEstateFloorPlans };
