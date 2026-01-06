import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import {
  FileText, Image, Search,
  Loader2, Save, MapPin, Home, Settings
} from "lucide-react";
import type { Media } from "@/types/shared/media";
import type { Property } from "@/types/real_estate/realEstate";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import { realEstateApi } from "@/api/real-estate";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { showError, showSuccess } from '@/core/toast';
import { propertyFormSchema } from '@/components/real-estate/validations/propertySchema';
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { collectMediaIds, collectMediaCovers, parsePropertyMedia } from "@/components/real-estate/utils/propertyMediaUtils";
import type { PropertyUpdateData } from "@/types/real_estate/realEstate";

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
const MediaTab = lazy(() => import("@/components/real-estate/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/real-estate/list/create/SEOTab"));
const LocationTab = lazy(() => import("@/components/real-estate/list/create/LocationTab"));
const DetailsTab = lazy(() => import("@/components/real-estate/list/create/DetailsTab"));
const FloorPlansTab = lazy(() => import("@/components/real-estate/list/create/FloorPlansTab"));
const ExtraAttributesTab = lazy(() => import("@/components/real-estate/list/create/ExtraAttributesTab"));

export default function EditPropertyPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, _setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyMedia, setPropertyMedia] = useState<PropertyMedia>({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
  });
  const [formData, setFormData] = useState({
    title: "",
    region: undefined,
    region_name: "",
    slug: "",
    short_description: "",
    description: "",
    meta_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    og_image: null as Media | null,
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
    district_name: null as string | null,
    address: "",
    neighborhood: "",
    latitude: null as number | null,
    longitude: null as number | null,
    land_area: null as number | null,
    built_area: null as number | null,
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    price: null as number | null,
    price_per_sqm: null as number | null,
    mortgage_amount: null as number | null,
    rent_amount: null as number | null,
    year_built: null as number | null,
    floors_in_building: null as number | null,
    parking_spaces: null as number | null,
    storage_rooms: null as number | null,
    extra_attributes: {} as Record<string, any>,
    status: "active" as string,
  });

  const [selectedLabels, setSelectedLabels] = useState<PropertyLabel[]>([]);
  const [selectedTags, setSelectedTags] = useState<PropertyTag[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<PropertyFeature[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (id) {
      fetchPropertyData();
    }
  }, [id]);

  const fetchPropertyData = async () => {
    try {
      setIsLoading(true);
      const propertyData: any = await realEstateApi.getPropertyById(Number(id));
      setProperty(propertyData);

      setFormData({
        title: propertyData.title || "",
        slug: propertyData.slug || "",
        short_description: propertyData.short_description || "",
        description: propertyData.description || "",
        meta_title: propertyData.meta_title || "",
        meta_description: propertyData.meta_description || "",
        og_title: propertyData.og_title || "",
        og_description: propertyData.og_description || "",
        og_image: propertyData.og_image || null,
        canonical_url: propertyData.canonical_url || "",
        robots_meta: propertyData.robots_meta || "",
        is_public: propertyData.is_public ?? true,
        is_active: propertyData.is_active ?? true,
        is_published: propertyData.is_published ?? false,
        is_featured: propertyData.is_featured ?? false,
        property_type: propertyData.property_type?.id || null,
        state: propertyData.state?.id || null,
        agent: propertyData.agent?.id || null,
        agency: propertyData.agency?.id || null,
        province: propertyData.province || null,
        city: propertyData.city || null,
        region: propertyData.district || null,
        district: propertyData.district || null,
        country: propertyData.country || null,
        region_name: propertyData.region_name || "",
        district_name: propertyData.district_name || "",
        address: propertyData.address || "",
        neighborhood: propertyData.neighborhood || "",
        latitude: propertyData.latitude ? Number(propertyData.latitude) : null,
        longitude: propertyData.longitude ? Number(propertyData.longitude) : null,
        land_area: propertyData.land_area ? Number(propertyData.land_area) : null,
        built_area: propertyData.built_area ? Number(propertyData.built_area) : null,
        bedrooms: propertyData.bedrooms || null,
        bathrooms: propertyData.bathrooms || null,
        price: propertyData.price ? Number(propertyData.price) : null,
        price_per_sqm: propertyData.price_per_sqm ? Number(propertyData.price_per_sqm) : null,
        mortgage_amount: propertyData.mortgage_amount ? Number(propertyData.mortgage_amount) : null,
        rent_amount: propertyData.rent_amount ? Number(propertyData.rent_amount) : null,
        year_built: propertyData.year_built ? Number(propertyData.year_built) : null,
        floors_in_building: propertyData.floors_in_building ? Number(propertyData.floors_in_building) : null,
        parking_spaces: propertyData.parking_spaces ? Number(propertyData.parking_spaces) : null,
        storage_rooms: propertyData.storage_rooms ? Number(propertyData.storage_rooms) : null,
        extra_attributes: propertyData.extra_attributes || {},
        status: typeof propertyData.status === 'object' ? propertyData.status?.value : (propertyData.status || "active"),
      });

      if (propertyData.labels) {
        setSelectedLabels(propertyData.labels);
      }

      if (propertyData.tags) {
        setSelectedTags(propertyData.tags);
      }

      if (propertyData.features) {
        setSelectedFeatures(propertyData.features);
      }

      if (propertyData.property_media || propertyData.media) {
        const parsedMedia = parsePropertyMedia(propertyData.property_media || propertyData.media || []);
        setPropertyMedia(parsedMedia);
      }
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Media | boolean | null | number | Record<string, any>) => {
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
  };

  const handleLocationChange = useCallback((latitude: number | null, longitude: number | null) => {
    setFormData(prev => ({ ...prev, latitude, longitude }));
  }, []);

  const handleLabelToggle = (label: PropertyLabel) => {
    setSelectedLabels(prev => {
      if (prev.some(l => l.id === label.id)) {
        return prev.filter(l => l.id !== label.id);
      } else {
        return [...prev, label];
      }
    });
  };

  const handleLabelRemove = (labelId: number) => {
    setSelectedLabels(prev => prev.filter(label => label.id !== labelId));
  };

  const handleTagToggle = (tag: PropertyTag) => {
    setSelectedTags(prev => {
      if (prev.some(t => t.id === tag.id)) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleTagRemove = (tagId: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const handleFeatureToggle = (feature: PropertyFeature) => {
    setSelectedFeatures(prev => {
      if (prev.some(f => f.id === feature.id)) {
        return prev.filter(f => f.id !== feature.id);
      } else {
        return [...prev, feature];
      }
    });
  };

  const handleFeatureRemove = (featureId: number) => {
    setSelectedFeatures(prev => prev.filter(feature => feature.id !== featureId));
  };

  const handleFeaturedImageChange = (media: Media | null) => {
    setPropertyMedia(prev => ({
      ...prev,
      featuredImage: media
    }));
  };

  const handleSave = async () => {
    if (!property) return;

    setIsSaving(true);
    setErrors({});
    try {
      const dataToValidate = {
        ...formData,
        labels_ids: selectedLabels.map(label => label.id),
        tags_ids: selectedTags.map(tag => tag.id),
        features_ids: selectedFeatures.map(feature => feature.id),
      };
      
      try {
        propertyFormSchema.pick({
          title: true,
          slug: true,
          property_type: true,
          state: true,
          status: true,
        }).parse({
          title: dataToValidate.title,
          slug: dataToValidate.slug,
          property_type: dataToValidate.property_type,
          state: dataToValidate.state,
          status: dataToValidate.status,
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
          setErrors(accountErrors);
          setActiveTab("account");
          setIsSaving(false);
          return;
        }
      }
      
      try {
        propertyFormSchema.pick({
          province: true,
          city: true,
          address: true,
        }).parse({
          province: dataToValidate.province,
          city: dataToValidate.city,
          address: dataToValidate.address,
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
          setErrors(locationErrors);
          setActiveTab("location");
          setIsSaving(false);
          return;
        }
      }
      
      const validatedData = propertyFormSchema.parse(dataToValidate);

      let formattedSlug = formatSlug(validatedData.slug);

      const labelIds = validatedData.labels_ids;
      const tagIds = validatedData.tags_ids;
      const featureIds = validatedData.features_ids;

      const allMediaIds = collectMediaIds(propertyMedia);
      const mainImageId = propertyMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(propertyMedia);

      const updateData: PropertyUpdateData = {
        title: validatedData.title,
        slug: formattedSlug,
        short_description: validatedData.short_description,
        description: validatedData.description,
        labels_ids: labelIds,
        tags_ids: tagIds,
        features_ids: featureIds,
        media_ids: allMediaIds,
        main_image_id: mainImageId,
        media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
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
        property_type: validatedData.property_type || property.property_type?.id || undefined,
        state: validatedData.state || property.state?.id || undefined,
        agent: validatedData.agent || property.agent?.id || undefined,
        agency: validatedData.agency || property.agency?.id || undefined,
        province: validatedData.province || undefined,
        city: validatedData.city || undefined,
        region: validatedData.district || undefined,
        region_name: formData.region_name || undefined,
        address: validatedData.address || property.address || undefined,
        neighborhood: validatedData.neighborhood || undefined,
        latitude: validatedData.latitude !== null && validatedData.latitude !== undefined
          ? validatedData.latitude
          : (property.latitude ? Number(property.latitude) : undefined),
        longitude: validatedData.longitude !== null && validatedData.longitude !== undefined
          ? validatedData.longitude
          : (property.longitude ? Number(property.longitude) : undefined),
        land_area: validatedData.land_area !== null && validatedData.land_area !== undefined
          ? validatedData.land_area
          : (property.land_area ? Number(property.land_area) : undefined),
        built_area: validatedData.built_area !== null && validatedData.built_area !== undefined
          ? validatedData.built_area
          : (property.built_area ? Number(property.built_area) : undefined),
        bedrooms: validatedData.bedrooms !== null && validatedData.bedrooms !== undefined
          ? validatedData.bedrooms
          : (property.bedrooms || undefined),
        bathrooms: validatedData.bathrooms !== null && validatedData.bathrooms !== undefined
          ? validatedData.bathrooms
          : (property.bathrooms || undefined),
        price: validatedData.price,
        mortgage_amount: validatedData.mortgage_amount,
        rent_amount: validatedData.rent_amount,
        year_built: validatedData.year_built,
        floors_in_building: validatedData.floors_in_building,
        parking_spaces: validatedData.parking_spaces,
        storage_rooms: validatedData.storage_rooms,
        status: validatedData.status,
        extra_attributes: validatedData.extra_attributes && Object.keys(validatedData.extra_attributes).length > 0
          ? validatedData.extra_attributes
          : undefined,
      };

      await realEstateApi.partialUpdateProperty(property.id, updateData);
      showSuccess("ملک با موفقیت ویرایش شد");
      navigate("/real-estate/properties");
    } catch (error: any) {
      if (error.errors || error.issues) {
        const fieldErrors: Record<string, string> = {};
        const errorsToProcess = error.errors || error.issues || [];
        
        errorsToProcess.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            const fieldName = err.path[0];
            if (!fieldErrors[fieldName]) {
              fieldErrors[fieldName] = err.message;
            }
          }
        });
        setErrors(fieldErrors);
        setIsSaving(false);
        return;
      }
      
      if (error.response && error.response.status === 400) {
        const backendErrors = error.response.data;
        const newErrors: Record<string, string> = {};

        Object.keys(backendErrors).forEach(key => {
          const err = backendErrors[key];
          if (Array.isArray(err)) {
            newErrors[key] = err[0];
          } else if (typeof err === 'string') {
            newErrors[key] = err;
          }
        });

        setErrors(newErrors);
        setIsSaving(false);
      } else {
        showError(error);
        setIsSaving(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!property) return;

    setIsSavingDraft(true);
    setErrors({});
    try {
      const dataToValidate = {
        ...formData,
        labels_ids: selectedLabels.map(label => label.id),
        tags_ids: selectedTags.map(tag => tag.id),
        features_ids: selectedFeatures.map(feature => feature.id),
      };
      
      try {
        propertyFormSchema.pick({
          title: true,
          slug: true,
          property_type: true,
          state: true,
          status: true,
        }).parse({
          title: dataToValidate.title,
          slug: dataToValidate.slug,
          property_type: dataToValidate.property_type,
          state: dataToValidate.state,
          status: dataToValidate.status,
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
          setErrors(accountErrors);
          setActiveTab("account");
          setIsSavingDraft(false);
          return;
        }
      }
      
      try {
        propertyFormSchema.pick({
          province: true,
          city: true,
          address: true,
        }).parse({
          province: dataToValidate.province,
          city: dataToValidate.city,
          address: dataToValidate.address,
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
          setErrors(locationErrors);
          setActiveTab("location");
          setIsSavingDraft(false);
          return;
        }
      }
      
      const validatedData = propertyFormSchema.parse(dataToValidate);

      let formattedSlug = formatSlug(validatedData.slug);

      const labelIds = validatedData.labels_ids;
      const tagIds = validatedData.tags_ids;
      const featureIds = validatedData.features_ids;

      const allMediaIds = collectMediaIds(propertyMedia);
      const mainImageId = propertyMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(propertyMedia);

      const updateData: PropertyUpdateData = {
        title: validatedData.title,
        slug: formattedSlug,
        short_description: validatedData.short_description,
        description: validatedData.description,
        labels_ids: labelIds,
        tags_ids: tagIds,
        features_ids: featureIds,
        media_ids: allMediaIds,
        main_image_id: mainImageId,
        media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
        meta_title: validatedData.meta_title || undefined,
        meta_description: validatedData.meta_description || undefined,
        og_title: validatedData.og_title || undefined,
        og_description: validatedData.og_description || undefined,
        og_image_id: validatedData.og_image_id || undefined,
        canonical_url: validatedData.canonical_url || undefined,
        robots_meta: validatedData.robots_meta || undefined,
        is_public: validatedData.is_public,
        is_active: validatedData.is_active,
        is_published: false,
        is_featured: validatedData.is_featured,
        property_type: validatedData.property_type || undefined,
        state: validatedData.state || undefined,
        agent: validatedData.agent || undefined,
        agency: validatedData.agency || undefined,
        province: validatedData.province || undefined,
        city: validatedData.city || undefined,
        region: validatedData.district || undefined,
        region_name: formData.region_name || undefined,
        neighborhood: validatedData.neighborhood || undefined,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        land_area: validatedData.land_area,
        built_area: validatedData.built_area,
        bedrooms: validatedData.bedrooms,
        bathrooms: validatedData.bathrooms,
        price: validatedData.price,
        mortgage_amount: validatedData.mortgage_amount,
        rent_amount: validatedData.rent_amount,
        year_built: validatedData.year_built,
        floors_in_building: validatedData.floors_in_building,
        parking_spaces: validatedData.parking_spaces,
        storage_rooms: validatedData.storage_rooms,
        status: validatedData.status,
        extra_attributes: validatedData.extra_attributes && Object.keys(validatedData.extra_attributes).length > 0
          ? validatedData.extra_attributes
          : undefined,
      };

      await realEstateApi.partialUpdateProperty(property.id, updateData);
      showSuccess("پیش‌نویس با موفقیت ذخیره شد");
      navigate("/real-estate/properties");
    } catch (error: any) {
      if (error.errors || error.issues) {
        const fieldErrors: Record<string, string> = {};
        const errorsToProcess = error.errors || error.issues || [];
        
        errorsToProcess.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            const fieldName = err.path[0];
            if (!fieldErrors[fieldName]) {
              fieldErrors[fieldName] = err.message;
            }
          }
        });
        setErrors(fieldErrors);
        setIsSavingDraft(false);
        return;
      }
      
      if (error.response && error.response.status === 400) {
        const backendErrors = error.response.data;
        const newErrors: Record<string, string> = {};

        Object.keys(backendErrors).forEach(key => {
          const err = backendErrors[key];
          if (Array.isArray(err)) {
            newErrors[key] = err[0];
          } else if (typeof err === 'string') {
            newErrors[key] = err;
          }
        });

        setErrors(newErrors);
        setIsSavingDraft(false);
      } else {
        showError(error);
        setIsSavingDraft(false);
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (isLoading) {
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
              جزئیات و قیمت
            </TabsTrigger>
            <TabsTrigger value="floorplans">
              <Home className="h-4 w-4" />
              پلان‌ها
            </TabsTrigger>
            <TabsTrigger value="media">
              <Image className="h-4 w-4" />
              مدیا
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="h-4 w-4" />
              سئو
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4" />
              فیلدهای اضافی
            </TabsTrigger>
          </TabsList>
          <TabSkeleton />
        </Tabs>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">ملک مورد نظر یافت نشد.</p>
      </div>
    );
  }

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
            جزئیات و قیمت
          </TabsTrigger>
          <TabsTrigger value="floorplans">
            <Home className="h-4 w-4" />
            پلان‌ها
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="h-4 w-4" />
            مدیا
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="h-4 w-4" />
            سئو
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="h-4 w-4" />
            فیلدهای اضافی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Suspense fallback={<TabSkeleton />}>
            <BaseInfoTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
              selectedLabels={selectedLabels}
              selectedTags={selectedTags}
              selectedFeatures={selectedFeatures}
              onLabelToggle={handleLabelToggle}
              onLabelRemove={handleLabelRemove}
              onTagToggle={handleTagToggle}
              onTagRemove={handleTagRemove}
              onFeatureToggle={handleFeatureToggle}
              onFeatureRemove={handleFeatureRemove}
              propertyId={id}
              errors={errors}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="location">
          <Suspense fallback={<TabSkeleton />}>
            <LocationTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleLocationChange}
              errors={errors}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="details">
          <Suspense fallback={<TabSkeleton />}>
            <DetailsTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
              errors={errors}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="floorplans">
          <Suspense fallback={<TabSkeleton />}>
            <FloorPlansTab
              propertyId={id ? Number(id) : undefined}
              editMode={editMode}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="media">
          <Suspense fallback={<TabSkeleton />}>
            <MediaTab
              propertyMedia={propertyMedia}
              setPropertyMedia={setPropertyMedia}
              editMode={editMode}
              featuredImage={propertyMedia.featuredImage}
              onFeaturedImageChange={handleFeaturedImageChange}
              propertyId={id}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="seo">
          <Suspense fallback={<TabSkeleton />}>
            <SEOTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
              propertyId={id}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="advanced">
          <Suspense fallback={<TabSkeleton />}>
            <ExtraAttributesTab
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
            />
          </Suspense>
        </TabsContent>
      </Tabs>

      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            size="lg"
            disabled={isSaving || isSavingDraft}
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                ذخیره پیش‌نویس
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            size="lg"
            disabled={isSaving || isSavingDraft}
          >
            {isSaving ? (
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
      )}
    </div>
  );
}

