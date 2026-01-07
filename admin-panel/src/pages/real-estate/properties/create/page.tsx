import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import {
  FileText, Image, Search,
  Loader2, Save, MapPin, Home, Settings, FileJson
} from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { msg } from '@/core/messages';
import { propertyFormSchema, propertyFormDefaults, type PropertyFormValues } from '@/components/real-estate/validations/propertySchema';
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { collectMediaFilesAndIds, parsePropertyMedia } from "@/components/real-estate/utils/propertyMediaUtils";
import type { Property } from "@/types/real_estate/realEstate";
import type { Media } from "@/types/shared/media";

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
              <Skeleton className="h-64 w-full" />
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
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState<string>("account");
  const isEditMode = !!id;
  const [tempFloorPlans, setTempFloorPlans] = useState<any[]>([]);
  const [regionName, setRegionName] = useState<string>("");
  const [districtName, setDistrictName] = useState<string | null>(null);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: propertyFormDefaults,
    mode: "onSubmit",
  });

  const { data: property } = useQuery({
    queryKey: ['property', id],
    queryFn: () => realEstateApi.getPropertyById(Number(id!)),
    enabled: !!id && isEditMode,
  });

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

  // Wrapper برای تب‌هایی که از formData و handleInputChange استفاده می‌کنند
  const formData = form.watch();
  const handleInputChange = useCallback((field: string, value: any) => {
    form.setValue(field as keyof PropertyFormValues, value, { shouldValidate: false });
  }, [form]);

  // پر کردن فرم با داده موجود (برای edit mode)
  useEffect(() => {
    if (property && isEditMode) {
      const parsedMedia = (property.property_media || property.media)
        ? parsePropertyMedia(property.property_media || property.media || [])
        : {
            featuredImage: null,
            imageGallery: [],
            videoGallery: [],
            audioGallery: [],
            pdfDocuments: []
          };
      
      setPropertyMedia(parsedMedia);
      
      if (property.labels) {
        setSelectedLabels(property.labels);
      }
      if (property.tags) {
        setSelectedTags(property.tags);
      }
      if (property.features) {
        setSelectedFeatures(property.features);
      }
      
      setRegionName((property as any).region_name || "");
      setDistrictName((property as any).district_name || null);
      
      form.reset({
        title: property.title || "",
        slug: property.slug || "",
        short_description: property.short_description || "",
        description: property.description || "",
        meta_title: property.meta_title || "",
        meta_description: property.meta_description || "",
        og_title: property.og_title || "",
        og_description: property.og_description || "",
        og_image: property.og_image || null,
        og_image_id: property.og_image?.id || null,
        canonical_url: property.canonical_url || "",
        robots_meta: property.robots_meta || "",
        is_public: property.is_public ?? true,
        is_active: property.is_active ?? true,
        is_published: property.is_published ?? false,
        is_featured: property.is_featured ?? false,
        property_type: property.property_type?.id || undefined,
        state: property.state?.id || undefined,
        agent: property.agent?.id || null,
        agency: property.agency?.id || null,
        province: (property.province as any)?.id || property.province || null,
        city: (property.city as any)?.id || property.city || null,
        district: (property.district as any)?.id || property.district || null,
        address: property.address || "",
        postal_code: (property as any).postal_code || "",
        neighborhood: property.neighborhood || "",
        latitude: property.latitude ? Number(property.latitude) : null,
        longitude: property.longitude ? Number(property.longitude) : null,
        land_area: property.land_area ? Number(property.land_area) : null,
        built_area: property.built_area ? Number(property.built_area) : null,
        bedrooms: property.bedrooms || null,
        bathrooms: property.bathrooms || null,
        kitchens: (property as any).kitchens || null,
        living_rooms: (property as any).living_rooms || null,
        year_built: property.year_built ? Number(property.year_built) : null,
        build_years: (property as any).build_years || null,
        floors_in_building: property.floors_in_building ? Number(property.floors_in_building) : null,
        floor_number: (property as any).floor_number || null,
        parking_spaces: property.parking_spaces ? Number(property.parking_spaces) : null,
        storage_rooms: property.storage_rooms ? Number(property.storage_rooms) : null,
        document_type: (property as any).document_type || null,
        price: property.price ? Number(property.price) : null,
        sale_price: (property as any).sale_price ? Number((property as any).sale_price) : null,
        pre_sale_price: (property as any).pre_sale_price ? Number((property as any).pre_sale_price) : null,
        monthly_rent: (property as any).monthly_rent ? Number((property as any).monthly_rent) : null,
        mortgage_amount: property.mortgage_amount ? Number(property.mortgage_amount) : null,
        rent_amount: property.rent_amount ? Number(property.rent_amount) : null,
        security_deposit: (property as any).security_deposit ? Number((property as any).security_deposit) : null,
        status: typeof property.status === 'object' ? (property.status as any)?.value : (property.status || "active"),
        extra_attributes: property.extra_attributes || {},
        labels_ids: property.labels?.map((l: any) => l.id) || [],
        tags_ids: property.tags?.map((t: any) => t.id) || [],
        features_ids: property.features?.map((f: any) => f.id) || [],
        main_image_id: property.main_image?.id || null,
      });
    }
  }, [property, isEditMode, form]);

  // Auto-generate slug from title
  const titleValue = form.watch("title");
  useEffect(() => {
    if (titleValue && !isEditMode) {
      const generatedSlug = generateSlug(titleValue);
      form.setValue("slug", generatedSlug, { shouldValidate: false });
    }
  }, [titleValue, form, isEditMode]);

  const handleFeaturedImageChange = (media: Media | null) => {
    setPropertyMedia(prev => ({
      ...prev,
      featuredImage: media
    }));
    form.setValue("main_image_id", media?.id || null, { shouldValidate: false });
  };


  const handleLabelToggle = useCallback((label: PropertyLabel) => {
    setSelectedLabels(prev => {
      const newLabels = prev.find(l => l.id === label.id)
        ? prev.filter(l => l.id !== label.id)
        : [...prev, label];
      form.setValue("labels_ids", newLabels.map(l => l.id), { shouldValidate: false });
        return newLabels;
    });
  }, [form]);

  const handleLabelRemove = useCallback((labelId: number) => {
    setSelectedLabels(prev => {
      const newLabels = prev.filter(l => l.id !== labelId);
      form.setValue("labels_ids", newLabels.map(l => l.id), { shouldValidate: false });
      return newLabels;
    });
  }, [form]);

  const handleTagToggle = useCallback((tag: PropertyTag) => {
    setSelectedTags(prev => {
      const newTags = prev.find(t => t.id === tag.id)
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag];
      form.setValue("tags_ids", newTags.map(t => t.id), { shouldValidate: false });
        return newTags;
    });
  }, [form]);

  const handleTagRemove = useCallback((tagId: number) => {
    setSelectedTags(prev => {
      const newTags = prev.filter(t => t.id !== tagId);
      form.setValue("tags_ids", newTags.map(t => t.id), { shouldValidate: false });
      return newTags;
    });
  }, [form]);

  const handleFeatureToggle = useCallback((feature: PropertyFeature) => {
    setSelectedFeatures(prev => {
      const newFeatures = prev.find(f => f.id === feature.id)
        ? prev.filter(f => f.id !== feature.id)
        : [...prev, feature];
      form.setValue("features_ids", newFeatures.map(f => f.id), { shouldValidate: false });
        return newFeatures;
    });
  }, [form]);

  const handleFeatureRemove = useCallback((featureId: number) => {
    setSelectedFeatures(prev => {
      const newFeatures = prev.filter(f => f.id !== featureId);
      form.setValue("features_ids", newFeatures.map(f => f.id), { shouldValidate: false });
      return newFeatures;
    });
  }, [form]);

  const handleLocationChange = useCallback((latitude: number | null, longitude: number | null) => {
    form.setValue("latitude", latitude, { shouldValidate: false });
    form.setValue("longitude", longitude, { shouldValidate: false });
  }, [form]);

  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      // Validation برای تب account
      try {
        propertyFormSchema.pick({
          title: true,
          slug: true,
          property_type: true,
          state: true,
          status: true,
        }).parse({
          title: data.title,
          slug: data.slug,
          property_type: data.property_type,
          state: data.state,
          status: data.status,
        });
      } catch (accountError: any) {
        if (accountError.errors || accountError.issues) {
          const accountErrors: Record<string, string> = {};
          const errorsToProcess = accountError.errors || accountError.issues || [];
          errorsToProcess.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              const fieldName = err.path[0];
              if (!accountErrors[fieldName]) {
                accountErrors[fieldName] = err.message;
              }
            }
          });
          Object.entries(accountErrors).forEach(([field, message]) => {
            form.setError(field as keyof PropertyFormValues, { type: 'validation', message });
          });
          setActiveTab("account");
          throw accountError;
        }
      }
      
      // Validation برای تب location
      try {
        propertyFormSchema.pick({
          province: true,
          city: true,
          address: true,
        }).parse({
          province: data.province,
          city: data.city,
          address: data.address,
        });
      } catch (locationError: any) {
        if (locationError.errors || locationError.issues) {
          const locationErrors: Record<string, string> = {};
          const errorsToProcess = locationError.errors || locationError.issues || [];
          errorsToProcess.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              const fieldName = err.path[0];
              if (!locationErrors[fieldName]) {
                locationErrors[fieldName] = err.message;
              }
            }
          });
          Object.entries(locationErrors).forEach(([field, message]) => {
            form.setError(field as keyof PropertyFormValues, { type: 'validation', message });
          });
          setActiveTab("location");
          throw locationError;
        }
      }
      
      const validatedData = propertyFormSchema.parse(data);
      const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(
        propertyMedia,
        validatedData.og_image
      );

      const updateData: any = {
        title: validatedData.title,
        slug: formatSlug(validatedData.slug),
        short_description: validatedData.short_description || "",
        description: validatedData.description || "",
        labels_ids: validatedData.labels_ids,
        tags_ids: validatedData.tags_ids,
        features_ids: validatedData.features_ids,
        meta_title: validatedData.meta_title || undefined,
        meta_description: validatedData.meta_description || undefined,
        og_title: validatedData.og_title || undefined,
        og_description: validatedData.og_description || undefined,
        og_image_id: validatedData.og_image_id || undefined,
        canonical_url: validatedData.canonical_url || undefined,
        robots_meta: validatedData.robots_meta || undefined,
        is_public: validatedData.is_public,
        is_active: validatedData.is_active,
        is_published: validatedData.is_published,
        is_featured: validatedData.is_featured,
        property_type: validatedData.property_type || undefined,
        state: validatedData.state || undefined,
        agent: validatedData.agent || undefined,
        agency: validatedData.agency || undefined,
        province: validatedData.province || undefined,
        city: validatedData.city || undefined,
        region: validatedData.district || undefined,
        region_name: regionName || undefined,
        district_name: districtName || undefined,
        address: validatedData.address || undefined,
        neighborhood: validatedData.neighborhood || undefined,
        latitude: validatedData.latitude !== null && validatedData.latitude !== undefined ? validatedData.latitude : undefined,
        longitude: validatedData.longitude !== null && validatedData.longitude !== undefined ? validatedData.longitude : undefined,
        land_area: validatedData.land_area !== null && validatedData.land_area !== undefined ? validatedData.land_area : undefined,
        built_area: validatedData.built_area !== null && validatedData.built_area !== undefined ? validatedData.built_area : undefined,
        bedrooms: validatedData.bedrooms !== null && validatedData.bedrooms !== undefined ? validatedData.bedrooms : undefined,
        bathrooms: validatedData.bathrooms !== null && validatedData.bathrooms !== undefined ? validatedData.bathrooms : undefined,
        kitchens: validatedData.kitchens !== null && validatedData.kitchens !== undefined ? validatedData.kitchens : undefined,
        living_rooms: validatedData.living_rooms !== null && validatedData.living_rooms !== undefined ? validatedData.living_rooms : undefined,
        year_built: validatedData.year_built !== null && validatedData.year_built !== undefined ? validatedData.year_built : undefined,
        build_years: validatedData.build_years !== null && validatedData.build_years !== undefined ? validatedData.build_years : undefined,
        floors_in_building: validatedData.floors_in_building !== null && validatedData.floors_in_building !== undefined ? validatedData.floors_in_building : undefined,
        floor_number: validatedData.floor_number !== null && validatedData.floor_number !== undefined ? validatedData.floor_number : undefined,
        parking_spaces: validatedData.parking_spaces !== null && validatedData.parking_spaces !== undefined ? validatedData.parking_spaces : undefined,
        storage_rooms: validatedData.storage_rooms !== null && validatedData.storage_rooms !== undefined ? validatedData.storage_rooms : undefined,
        document_type: validatedData.document_type || undefined,
        price: validatedData.price !== null && validatedData.price !== undefined ? validatedData.price : 0,
        sale_price: validatedData.sale_price !== null && validatedData.sale_price !== undefined ? validatedData.sale_price : undefined,
        pre_sale_price: validatedData.pre_sale_price !== null && validatedData.pre_sale_price !== undefined ? validatedData.pre_sale_price : undefined,
        monthly_rent: validatedData.monthly_rent !== null && validatedData.monthly_rent !== undefined ? validatedData.monthly_rent : undefined,
        mortgage_amount: validatedData.mortgage_amount !== null && validatedData.mortgage_amount !== undefined ? validatedData.mortgage_amount : 0,
        rent_amount: validatedData.rent_amount !== null && validatedData.rent_amount !== undefined ? validatedData.rent_amount : 0,
        security_deposit: validatedData.security_deposit !== null && validatedData.security_deposit !== undefined ? validatedData.security_deposit : undefined,
        status: validatedData.status,
        extra_attributes: validatedData.extra_attributes && Object.keys(validatedData.extra_attributes).length > 0 ? validatedData.extra_attributes : undefined,
      };

      if (allMediaIds.length > 0) {
        updateData.media_ids = allMediaIds;
      }

      let property: Property;
      if (isEditMode && id) {
        property = await realEstateApi.updateProperty(Number(id), updateData);
        if (allMediaFiles.length > 0 || allMediaIds.length > 0) {
          await realEstateApi.addMediaToProperty(Number(id), allMediaFiles, allMediaIds);
        }
      } else {
        if (allMediaFiles.length > 0) {
          property = await realEstateApi.createPropertyWithMedia(updateData, allMediaFiles);
        } else {
          property = await realEstateApi.createProperty(updateData);
        }
      }

      return property;
    },
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      if (isEditMode && id) {
        queryClient.invalidateQueries({ queryKey: ['property', id] });
      }
      
      // ✅ از msg.crud استفاده کنید
      showSuccess(isEditMode 
        ? msg.crud("updated", { item: "ملک" })
        : msg.crud("created", { item: "ملک" })
      );
      navigate(`/real-estate/properties/${property.id}/view`);
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof PropertyFormValues, {
            type: 'server',
            message: message as string
          });
          
          // Switch to appropriate tab based on field
          if (['title', 'slug', 'property_type', 'state', 'status'].includes(field)) {
              setActiveTab("account");
          } else if (['province', 'city', 'address', 'latitude', 'longitude', 'postal_code', 'neighborhood'].includes(field)) {
              setActiveTab("location");
          } else if (['land_area', 'built_area', 'bedrooms', 'bathrooms', 'price', 'sale_price', 'monthly_rent', 'mortgage_amount'].includes(field)) {
              setActiveTab("details");
          }
        });
        
        showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
      } 
      // ✅ General Errors → فقط Toast
      else {
        showError(error);
      }
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    createPropertyMutation.mutate(data);
  });


  return (
    <div className="space-y-6 pb-28 relative">

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
            فیلدهای اضافی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Suspense fallback={<TabSkeleton />}>
            <BaseInfoTab
              form={form}
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
        <TabsContent value="location">
          <Suspense fallback={<TabSkeleton />}>
            <LocationTab
              form={form}
              editMode={true}
              latitude={form.watch("latitude")}
              longitude={form.watch("longitude")}
              onLocationChange={handleLocationChange}
              regionName={regionName}
              districtName={districtName}
              onRegionNameChange={setRegionName}
              onDistrictNameChange={setDistrictName}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="details">
          <Suspense fallback={<TabSkeleton />}>
            <DetailsTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={true}
              errors={Object.fromEntries(
                Object.entries(form.formState.errors).map(([key, error]) => [
                  key,
                  typeof error === 'object' && error !== null && 'message' in error 
                    ? String(error.message) 
                    : ""
                ])
              ) as Record<string, string>}
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
              onFeaturedImageChange={handleFeaturedImageChange}
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
          disabled={createPropertyMutation.isPending || form.formState.isSubmitting}
        >
          {createPropertyMutation.isPending || form.formState.isSubmitting ? (
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
