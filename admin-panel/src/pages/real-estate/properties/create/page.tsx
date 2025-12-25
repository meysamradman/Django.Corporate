import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Save, ArrowLeft, FileText, MapPin, Image, Settings } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { showError, showSuccess } from "@/core/toast";
import BaseInfoTab from "@/components/real-estate/list/create/BaseInfoTab";
import SEOTab from "@/components/real-estate/list/create/SEOTab";
import MediaTab from "@/components/real-estate/list/create/MediaTab";
import LocationTab from "@/components/real-estate/list/create/LocationTab";
import type { PropertyUpdateData } from "@/types/real_estate/property";
import type { PropertyAgent } from "@/types/real_estate/agent/propertyAgent";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/propertyState";
import type { PropertyLabel } from "@/types/real_estate/label/propertyLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/propertyFeature";
import type { PropertyTag } from "@/types/real_estate/tags/propertyTag";

export default function PropertyCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("base-info");

  // Form data state
  const [formData, setFormData] = useState<Partial<PropertyUpdateData>>({
    title: "",
    slug: "",
    short_description: "",
    description: "",
    is_published: false,
    is_featured: false,
    is_public: true,
    is_verified: false,
    is_active: true,
    property_type: null,
    state: null,
    agent: null,
    agency: null,
    province: null,
    city: null,
    region: null,
    neighborhood: "",
    address: "",
    postal_code: "",
    latitude: null,
    longitude: null,
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    price: 0,
    price_per_meter: null,
    labels_ids: [],
    tags_ids: [],
    features_ids: [],
    // SEO fields
    meta_title: "",
    meta_description: "",
    focus_keyword: "",
    // Media
    main_image_id: null,
    og_image_id: null,
  });

  // Selected items state
  const [selectedLabels, setSelectedLabels] = useState<PropertyLabel[]>([]);
  const [selectedTags, setSelectedTags] = useState<PropertyTag[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<PropertyFeature[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle location changes
  const handleLocationChange = useCallback((lat: number | null, lng: number | null) => {
    setLatitude(lat);
    setLongitude(lng);
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  }, []);

  // Handle label/tag/feature changes
  const handleLabelToggle = useCallback((label: PropertyLabel) => {
    setSelectedLabels(prev => {
      const exists = prev.find(l => l.id === label.id);
      if (exists) {
        const newLabels = prev.filter(l => l.id !== label.id);
        setFormData(prevForm => ({
          ...prevForm,
          labels_ids: newLabels.map(l => l.id)
        }));
        return newLabels;
      } else {
        const newLabels = [...prev, label];
        setFormData(prevForm => ({
          ...prevForm,
          labels_ids: newLabels.map(l => l.id)
        }));
        return newLabels;
      }
    });
  }, []);

  const handleLabelRemove = useCallback((labelId: number) => {
    setSelectedLabels(prev => {
      const newLabels = prev.filter(l => l.id !== labelId);
      setFormData(prevForm => ({
        ...prevForm,
        labels_ids: newLabels.map(l => l.id)
      }));
      return newLabels;
    });
  }, []);

  const handleTagToggle = useCallback((tag: PropertyTag) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.id === tag.id);
      if (exists) {
        const newTags = prev.filter(t => t.id !== tag.id);
        setFormData(prevForm => ({
          ...prevForm,
          tags_ids: newTags.map(t => t.id)
        }));
        return newTags;
      } else {
        const newTags = [...prev, tag];
        setFormData(prevForm => ({
          ...prevForm,
          tags_ids: newTags.map(t => t.id)
        }));
        return newTags;
      }
    });
  }, []);

  const handleTagRemove = useCallback((tagId: number) => {
    setSelectedTags(prev => {
      const newTags = prev.filter(t => t.id !== tagId);
      setFormData(prevForm => ({
        ...prevForm,
        tags_ids: newTags.map(t => t.id)
      }));
      return newTags;
    });
  }, []);

  const handleFeatureToggle = useCallback((feature: PropertyFeature) => {
    setSelectedFeatures(prev => {
      const exists = prev.find(f => f.id === feature.id);
      if (exists) {
        const newFeatures = prev.filter(f => f.id !== feature.id);
        setFormData(prevForm => ({
          ...prevForm,
          features_ids: newFeatures.map(f => f.id)
        }));
        return newFeatures;
      } else {
        const newFeatures = [...prev, feature];
        setFormData(prevForm => ({
          ...prevForm,
          features_ids: newFeatures.map(f => f.id)
        }));
        return newFeatures;
      }
    });
  }, []);

  const handleFeatureRemove = useCallback((featureId: number) => {
    setSelectedFeatures(prev => {
      const newFeatures = prev.filter(f => f.id !== featureId);
      setFormData(prevForm => ({
        ...prevForm,
        features_ids: newFeatures.map(f => f.id)
      }));
      return newFeatures;
    });
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!formData.title?.trim()) {
        showError("عنوان ملک الزامی است");
        setActiveTab("base-info");
        return;
      }

      if (!formData.property_type) {
        showError("نوع ملک الزامی است");
        setActiveTab("base-info");
        return;
      }

      if (!formData.province || !formData.city) {
        showError("استان و شهر الزامی است");
        setActiveTab("base-info");
        return;
      }

      if (!formData.address?.trim()) {
        showError("آدرس الزامی است");
        setActiveTab("base-info");
        return;
      }

      const property = await realEstateApi.createProperty(formData);

      showSuccess("ملک با موفقیت ایجاد شد");
      navigate(`/real-estate/properties/${property.id}/view`);
    } catch (error) {
      console.error("Error creating property:", error);
      showError("خطا در ایجاد ملک");
    } finally {
      setIsLoading(false);
    }
  }, [formData, navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/real-estate/properties")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به لیست
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ایجاد ملک جدید</h1>
            <p className="text-muted-foreground">اطلاعات کامل ملک را وارد کنید</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? "در حال ذخیره..." : "ذخیره ملک"}
        </Button>
      </div>

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="base-info" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            اطلاعات پایه
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            رسانه
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            نقشه
          </TabsTrigger>
        </TabsList>

        <TabsContent value="base-info" className="mt-6">
          <CardWithIcon
            icon={Settings}
            title="اطلاعات پایه ملک"
            description="اطلاعات اصلی و ضروری ملک را وارد کنید"
          >
            <BaseInfoTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={true}
              selectedLabels={selectedLabels}
              selectedTags={selectedTags}
              selectedFeatures={selectedFeatures}
              onLabelToggle={handleLabelToggle}
              onLabelRemove={handleLabelRemove}
              onTagToggle={handleTagToggle}
              onTagRemove={handleTagRemove}
              onFeatureToggle={handleFeatureToggle}
              onFeatureRemove={handleFeatureRemove}
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleLocationChange}
            />
          </CardWithIcon>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <CardWithIcon
            icon={FileText}
            title="بهینه‌سازی موتور جستجو"
            description="تنظیمات SEO برای بهبود رتبه‌بندی در موتورهای جستجو"
          >
            <SEOTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={true}
            />
          </CardWithIcon>
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          <CardWithIcon
            icon={Image}
            title="تصاویر و رسانه‌ها"
            description="تصاویر و فایل‌های رسانه‌ای ملک را آپلود کنید"
          >
            <MediaTab
              propertyId={null}
              editMode={true}
            />
          </CardWithIcon>
        </TabsContent>

        <LocationTab
          formData={formData}
          handleInputChange={handleInputChange}
          editMode={true}
          latitude={formData.latitude}
          longitude={formData.longitude}
          onLocationChange={handleLocationChange}
          regionName={undefined}
        />
      </Tabs>
    </div>
  );
}
