import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import {
  FileText, Image, Search,
  Loader2, Save, List, MapPin
} from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { generateSlug } from '@/core/slug/generate';
import { showError, showSuccess } from '@/core/toast';
import type { PropertyLabel } from "@/types/real_estate/label/propertyLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/propertyFeature";
import type { PropertyTag } from "@/types/real_estate/tags/propertyTag";
import type { PropertyMedia } from "@/types/real_estate/propertyMedia";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="rounded-lg border border-br overflow-hidden">
          <div className="border-b border-b-blue-1 bg-bg/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue">
                <FileText className="h-5 w-5 stroke-blue-2" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <div className="rounded-lg border border-br overflow-hidden lg:sticky lg:top-20">
          <div className="border-b border-b-blue-1 bg-bg/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue">
                <FileText className="h-5 w-5 stroke-blue-2" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BaseInfoTab = lazy(() => import("@/components/real-estate/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/real-estate/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/real-estate/list/create/SEOTab"));
const LocationTab = lazy(() => import("@/components/real-estate/list/create/LocationTab"));

export default function PropertyCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("account");
  const [isEditMode, setIsEditMode] = useState(false);

  // Load property data if editing
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      const loadProperty = async () => {
        try {
          setIsLoading(true);
          const property = await realEstateApi.getPropertyById(Number(id));
          console.log('Loaded property data:', property);
          setFormData({
            title: property.title || "",
            slug: property.slug || "",
            short_description: property.short_description || "",
            description: property.description || "",
            is_published: property.is_published || false,
            is_featured: property.is_featured || false,
            is_public: property.is_public ?? true,
            is_active: property.is_active ?? true,
            property_type: property.property_type?.id || null,
            state: property.state?.id || null,
            agent: property.agent ? (property.agent as any).id : null,
            agency: property.agency ? (property.agency as any).id : null,
            province: property.province ? (property.province as any).id : null,
            city: property.city ? (property.city as any).id : null,
            district: (property as any).district || null,
            neighborhood: property.neighborhood || "",
            address: property.address || "",
            postal_code: property.postal_code || "",
            latitude: property.latitude || null,
            longitude: property.longitude || null,
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            land_area: property.land_area || 0,
            built_area: property.built_area || 0,
            price: property.price || 0,
            labels_ids: property.labels?.map((label: any) => label.id) || [],
            tags_ids: property.tags?.map((tag: any) => tag.id) || [],
            features_ids: property.features?.map((feature: any) => feature.id) || [],
            meta_title: property.meta_title || "",
            meta_description: property.meta_description || "",
            main_image_id: property.main_image?.id || null,
            og_image_id: property.og_image?.id || null,
          });

          // Set selected items
          setSelectedLabels(property.labels || []);
          setSelectedTags(property.tags || []);
          setSelectedFeatures(property.features || []);

          console.log('Set selected items:', {
            labels: property.labels,
            tags: property.tags,
            features: property.features
          });
        } catch (error) {
          console.error("Error loading property:", error);
          showError("خطا در بارگذاری اطلاعات ملک");
        } finally {
          setIsLoading(false);
        }
      };
      loadProperty();
    }
  }, [id]);

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    short_description: "",
    description: "",
    meta_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    og_image: null as any,
    canonical_url: "",
    robots_meta: "",
    is_public: true,
    is_active: true,
    is_published: false,
    is_featured: false,
    property_type: null as number | null,
    state: null as number | null,
    agent: null as number | null,
    agency: null as number | null,
    province: null as number | null,
    city: null as number | null,
    district: null as number | null,
    country: null as number | null,
    region_name: null as string | null,
    district_name: null as string | null,
    neighborhood: "",
    address: "",
    postal_code: "",
    latitude: null as number | null,
    longitude: null as number | null,
    land_area: null as number | null,
    built_area: null as number | null,
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    price: 0,
  });

  // Selected items state
  const [selectedLabels, setSelectedLabels] = useState<PropertyLabel[]>([]);
  const [selectedTags, setSelectedTags] = useState<PropertyTag[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<PropertyFeature[]>([]);
  const [propertyMedia, setPropertyMedia] = useState<PropertyMedia>({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
  });

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: string | any | boolean | null | number) => {
    if (field === "title" && typeof value === "string") {
      const generatedSlug = generateSlug(value);

      setFormData(prev => ({
        ...prev,
        [field]: value,
        slug: generatedSlug
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  // Handle location changes

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
        setActiveTab("account");
        return;
      }

      if (!formData.property_type) {
        showError("نوع ملک الزامی است");
        setActiveTab("account");
        return;
      }

      if (!formData.address?.trim()) {
        showError("آدرس الزامی است");
        setActiveTab("account");
        return;
      }

      const labelIds = selectedLabels.map(label => label.id);
      const tagIds = selectedTags.map(tag => tag.id);
      const featureIds = selectedFeatures.map(feature => feature.id);

      const updateData: any = {
        title: formData.title,
        slug: formData.slug,
        short_description: formData.short_description,
        description: formData.description,
        labels_ids: labelIds,
        tags_ids: tagIds,
        features_ids: featureIds,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        og_title: formData.og_title || undefined,
        og_description: formData.og_description || undefined,
        og_image_id: formData.og_image?.id || undefined,
        canonical_url: formData.canonical_url || undefined,
        robots_meta: formData.robots_meta || undefined,
        is_public: formData.is_public,
        is_active: formData.is_active,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        property_type: formData.property_type || undefined,
        state: formData.state || undefined,
        agent: formData.agent || undefined,
        agency: formData.agency || undefined,
        // Use region instead of district for PropertyUpdateData interface
        region: formData.district || undefined,
        region_name: formData.region_name || undefined,
        district_name: formData.district_name || undefined,
        address: formData.address || undefined,
        latitude: formData.latitude !== null && formData.latitude !== undefined
          ? formData.latitude
          : undefined,
        longitude: formData.longitude !== null && formData.longitude !== undefined
          ? formData.longitude
          : undefined,
        land_area: formData.land_area !== null && formData.land_area !== undefined
          ? formData.land_area
          : undefined,
        built_area: formData.built_area !== null && formData.built_area !== undefined
          ? formData.built_area
          : undefined,
        bedrooms: formData.bedrooms !== null && formData.bedrooms !== undefined
          ? formData.bedrooms
          : undefined,
        bathrooms: formData.bathrooms !== null && formData.bathrooms !== undefined
          ? formData.bathrooms
          : undefined,
      };

      let property;
      if (isEditMode && id) {
        property = await realEstateApi.updateProperty(Number(id), updateData);
      } else {
        property = await realEstateApi.createProperty(updateData);
      }

      showSuccess(isEditMode ? "ملک با موفقیت ویرایش شد" : "ملک با موفقیت ایجاد شد");
      navigate(`/real-estate/properties/${property.id}/view`);
    } catch (error) {
      console.error("Error creating property:", error);
      showError("خطا در ایجاد ملک");
    } finally {
      setIsLoading(false);
    }
  }, [formData, selectedLabels, selectedTags, selectedFeatures, navigate, isEditMode, id]);

  return (
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{isEditMode ? "ویرایش ملک" : "ایجاد ملک جدید"}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/real-estate/properties")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="account">
            <FileText className="h-4 w-4" />
            اطلاعات پایه
          </TabsTrigger>
          <TabsTrigger value="location">
            <MapPin className="h-4 w-4" />
            لوکیشن
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="h-4 w-4" />
            مدیا
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="h-4 w-4" />
            سئو
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Suspense fallback={<TabSkeleton />}>
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
              propertyId={undefined}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="media">
          <Suspense fallback={<TabSkeleton />}>
            <MediaTab
              propertyMedia={propertyMedia}
              setPropertyMedia={setPropertyMedia}
              editMode={true}
              featuredImage={propertyMedia.featuredImage}
              onFeaturedImageChange={(media) => {
                setPropertyMedia(prev => ({
                  ...prev,
                  featuredImage: media
                }));
              }}
              propertyId={undefined}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="location">
          <Suspense fallback={<TabSkeleton />}>
            <LocationTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={true}
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={useCallback((latitude: number | null, longitude: number | null) => {
                setFormData(prev => ({ ...prev, latitude, longitude }));
              }, [])}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="seo">
          <Suspense fallback={<TabSkeleton />}>
            <SEOTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={true}
              propertyId={undefined}
            />
          </Suspense>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          onClick={handleSubmit}
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ذخیره
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
