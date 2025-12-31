import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  FileText, Image, Search,
  Loader2, Save, List, MapPin, Home, Settings, FileJson
} from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { showError, showSuccess } from '@/core/toast';
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <CardWithIcon
          icon={FileText}
          title="اطلاعات پایه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
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

            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </CardWithIcon>
      </div>

      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <CardWithIcon
          icon={Settings}
          title="تنظیمات"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          className="lg:sticky lg:top-20"
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardWithIcon>
      </div>
    </div>
  </div>
);

const BaseInfoTab = lazy(() => import("@/components/real-estate/list/create/BaseInfoTab"));
const DetailsTab = lazy(() => import("@/components/real-estate/list/create/DetailsTab"));
const MediaTab = lazy(() => import("@/components/real-estate/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/real-estate/list/create/SEOTab"));
const LocationTab = lazy(() => import("@/components/real-estate/list/create/LocationTab"));
const FloorPlansTab = lazy(() => import("@/components/real-estate/list/create/FloorPlansTab"));
const ExtraAttributesTab = lazy(() => import("@/components/real-estate/list/create/ExtraAttributesTab"));


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
            meta_title: property.meta_title || "",
            meta_description: property.meta_description || "",
            og_title: property.og_title || "",
            og_description: property.og_description || "",
            og_image: property.og_image || null,
            canonical_url: property.canonical_url || "",
            robots_meta: property.robots_meta || "",
            is_public: property.is_public ?? true,
            is_active: property.is_active ?? true,
            is_published: property.is_published || false,
            is_featured: property.is_featured || false,
            is_verified: property.is_verified || false,
            property_type: property.property_type?.id || null,
            state: property.state?.id || null,
            agent: property.agent ? (property.agent as any).id : null,
            agency: property.agency ? (property.agency as any).id : null,
            province: property.province ? (property.province as any).id : null,
            city: property.city ? (property.city as any).id : null,
            district: (property as any).district || null,
            country: null,
            region_name: "",
            district_name: "",
            neighborhood: property.neighborhood || "",
            address: property.address || "",
            postal_code: property.postal_code || "",
            latitude: property.latitude || null,
            longitude: property.longitude || null,
            land_area: property.land_area || null,
            built_area: property.built_area || null,
            bedrooms: property.bedrooms || null,
            bathrooms: property.bathrooms || null,
            kitchens: property.kitchens || null,
            living_rooms: property.living_rooms || null,
            year_built: property.year_built || null,
            build_years: property.build_years || null,
            floors_in_building: property.floors_in_building || null,
            floor_number: property.floor_number || null,
            parking_spaces: property.parking_spaces || null,
            storage_rooms: property.storage_rooms || null,
            // usage_type حذف شد - از property_type استفاده می‌شود
            document_type: (property as any).document_type || null,
            price: property.price || null,
            sale_price: property.sale_price || null,
            pre_sale_price: property.pre_sale_price || null,
            monthly_rent: property.monthly_rent || null,
            mortgage_amount: property.mortgage_amount || null,
            rent_amount: property.rent_amount || null,
            security_deposit: property.security_deposit || null,
            extra_attributes: (property as any).extra_attributes || {},
            labels_ids: property.labels?.map((label: any) => label.id) || [],
            tags_ids: property.tags?.map((tag: any) => tag.id) || [],
            features_ids: property.features?.map((feature: any) => feature.id) || [],
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
    is_verified: false,
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
    kitchens: null as number | null,
    living_rooms: null as number | null,
    year_built: null as number | null,
    build_years: null as number | null,
    floors_in_building: null as number | null,
    floor_number: null as number | null,
    parking_spaces: null as number | null,
    storage_rooms: null as number | null,
    // usage_type: "residential" as string, // حذف شد
    document_type: null as string | null,
    price: null as number | null,
    sale_price: null as number | null,
    pre_sale_price: null as number | null,
    monthly_rent: null as number | null,
    mortgage_amount: null as number | null,
    rent_amount: null as number | null,
    security_deposit: null as number | null,
    extra_attributes: {} as Record<string, any>,
    labels_ids: [] as number[],
    tags_ids: [] as number[],
    features_ids: [] as number[],
    main_image_id: null as number | null,
    og_image_id: null as number | null,
  });

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Floor Plans state - برای ذخیره موقت پلان‌ها قبل از ایجاد ملک
  const [tempFloorPlans, setTempFloorPlans] = useState<any[]>([]);


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
    } else if (field === "slug" && typeof value === "string") {
      const formattedSlug = formatSlug(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedSlug
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
    setErrors({}); // Clear previous errors
    try {
      // Basic Frontend Validation (optional, can relay on backend)
      if (!formData.title?.trim()) {
        setErrors(prev => ({ ...prev, title: "عنوان ملک الزامی است" }));
        showError("لطفا خطاهای فرم را برطرف کنید");
        setActiveTab("account");
        setIsLoading(false);
        return;
      }

      if (!formData.title?.trim()) {
        showError("عنوان ملک الزامی است");
        setActiveTab("account");
        return;
      }

      const slugValidation = validateSlug(formData.slug, true);
      if (!slugValidation.isValid) {
        showError(slugValidation.error || "اسلاگ معتبر نیست");
        setActiveTab("account");
        return;
      }

      if (!formData.property_type) {
        showError("نوع ملک الزامی است");
        setActiveTab("account");
        return;
      }

      if (!formData.address?.trim()) {
        setErrors(prev => ({ ...prev, address: "آدرس الزامی است" }));
        showError("لطفا خطاهای فرم را برطرف کنید");
        setActiveTab("location"); // Address is in Location tab now
        setIsLoading(false);
        return;
      }

      // Location Validation
      if (!formData.province) {
        setErrors(prev => ({ ...prev, province: "استان الزامی است" }));
        showError("استان و شهر الزامی هستند");
        setActiveTab("location");
        setIsLoading(false);
        return;
      }

      if (!formData.city) {
        setErrors(prev => ({ ...prev, city: "شهر الزامی است" }));
        showError("استان و شهر الزامی هستند");
        setActiveTab("location");
        setIsLoading(false);
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
        province: formData.province || undefined,
        city: formData.city || undefined,
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
        kitchens: formData.kitchens !== null && formData.kitchens !== undefined
          ? formData.kitchens
          : undefined,
        living_rooms: formData.living_rooms !== null && formData.living_rooms !== undefined
          ? formData.living_rooms
          : undefined,
        year_built: formData.year_built !== null && formData.year_built !== undefined
          ? formData.year_built
          : undefined,
        build_years: formData.build_years !== null && formData.build_years !== undefined
          ? formData.build_years
          : undefined,
        floors_in_building: formData.floors_in_building !== null && formData.floors_in_building !== undefined
          ? formData.floors_in_building
          : undefined,
        floor_number: formData.floor_number !== null && formData.floor_number !== undefined
          ? formData.floor_number
          : undefined,
        parking_spaces: formData.parking_spaces !== null && formData.parking_spaces !== undefined
          ? formData.parking_spaces
          : undefined,
        storage_rooms: formData.storage_rooms !== null && formData.storage_rooms !== undefined
          ? formData.storage_rooms
          : undefined,
        document_type: formData.document_type || undefined,
        price: formData.price !== null && formData.price !== undefined
          ? formData.price
          : 0,
        sale_price: formData.sale_price !== null && formData.sale_price !== undefined
          ? formData.sale_price
          : undefined,
        pre_sale_price: formData.pre_sale_price !== null && formData.pre_sale_price !== undefined
          ? formData.pre_sale_price
          : undefined,
        monthly_rent: formData.monthly_rent !== null && formData.monthly_rent !== undefined
          ? formData.monthly_rent
          : undefined,
        mortgage_amount: formData.mortgage_amount !== null && formData.mortgage_amount !== undefined
          ? formData.mortgage_amount
          : 0,
        rent_amount: formData.rent_amount !== null && formData.rent_amount !== undefined
          ? formData.rent_amount
          : 0,
        security_deposit: formData.security_deposit !== null && formData.security_deposit !== undefined
          ? formData.security_deposit
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
    } catch (error: any) {
      console.error("Error creating property:", error);
      if (error.response && error.response.status === 400) {
        // Backend validation errors
        const backendErrors = error.response.data;
        const newErrors: Record<string, string> = {};

        // Map backend errors to frontend fields
        // Backend format might be { field: ["error1", "error2"] }
        Object.keys(backendErrors).forEach(key => {
          const err = backendErrors[key];
          if (Array.isArray(err)) {
            newErrors[key] = err[0];
          } else if (typeof err === 'string') {
            newErrors[key] = err;
          }
        });

        setErrors(newErrors);
        showError("لطفا خطاهای فرم را برطرف کنید");

        // Log keys to help debug which tab to switch to
        console.log("Validation keys:", Object.keys(newErrors));

      } else {
        showError("خطا در ایجاد ملک");
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, selectedLabels, selectedTags, selectedFeatures, navigate, isEditMode, id]);


  return (
    <div className="space-y-6 pb-28 relative">
      <PageHeader title={isEditMode ? "ویرایش ملک" : "ایجاد ملک جدید"}>
        <Button
          variant="outline"
          onClick={() => navigate("/real-estate/properties")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </PageHeader>

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
          <TabsTrigger value="details">
            <Home className="h-4 w-4" />
            جزییات و قیمت
          </TabsTrigger>
          <TabsTrigger value="floorplans">
            <Home className="h-4 w-4" />
            پلان‌ها
            {tempFloorPlans.length > 0 && (
              <span className="mr-1 text-xs bg-blue-1 text-white px-1.5 py-0.5 rounded">
                {tempFloorPlans.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="h-4 w-4" />
            مدیا
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="h-4 w-4" />
            سئو
          </TabsTrigger>
          <TabsTrigger value="extra">
            <FileJson className="h-4 w-4" />
            ویژگی‌های ویژه
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
              errors={errors}
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
        <TabsContent value="details">
          <Suspense fallback={<TabSkeleton />}>
            <DetailsTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={true}
              errors={errors}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="floorplans">
          <Suspense fallback={<TabSkeleton />}>
            <FloorPlansTab
              propertyId={id ? Number(id) : undefined}
              editMode={true}
              tempFloorPlans={tempFloorPlans}
              onTempFloorPlansChange={setTempFloorPlans}
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
        <TabsContent value="extra">
          <Suspense fallback={<TabSkeleton />}>
            <ExtraAttributesTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={true}
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
