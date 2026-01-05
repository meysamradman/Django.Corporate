import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo } from "@/core/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { Media } from "@/types/shared/media";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { Settings, Loader2, Save, Star, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { propertyFeatureFormSchema } from '@/components/real-estate/validations/featureSchema';

export default function EditPropertyFeaturePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const featureId = Number(id);
  
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    group: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: feature, isLoading, error } = useQuery({
    queryKey: ['property-feature', featureId],
    queryFn: () => realEstateApi.getFeatureById(featureId),
    enabled: !!featureId,
  });

  useEffect(() => {
    if (feature) {
      setFormData({
        title: feature.title || "",
        group: feature.group || "",
        is_active: feature.is_active,
      });
      
      if (feature.image) {
        setSelectedMedia(feature.image);
      }
    }
  }, [feature]);

  const updateFeatureMutation = useMutation({
    mutationFn: (data: Partial<PropertyFeature>) => realEstateApi.partialUpdateFeature(featureId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-feature', featureId] });
      queryClient.invalidateQueries({ queryKey: ['property-features'] });
      showSuccess("ویژگی ملک با موفقیت به‌روزرسانی شد");
      navigate("/real-estate/features");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در به‌روزرسانی ویژگی ملک";
      showError(errorMessage);
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (media: Media | Media[] | null) => {
    const selected = Array.isArray(media) ? media[0] || null : media;
    setSelectedMedia(selected);
    setIsMediaModalOpen(false);
  };

  const handleRemoveImage = () => {
    setSelectedMedia(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!feature) return;
    
    setErrors({});
    
    try {
      const validatedData = propertyFeatureFormSchema.parse({
        ...formData,
        image_id: selectedMedia?.id || null,
      });
      
      const submitData: Partial<PropertyFeature> = {};
      
      if (validatedData.title !== feature.title) {
        submitData.title = validatedData.title;
      }
      
      if (validatedData.group !== (feature.group || "")) {
        submitData.group = validatedData.group || null;
      }
      
      if (validatedData.is_active !== feature.is_active) {
        submitData.is_active = validatedData.is_active;
      }
      
      const currentImageId = feature.image?.id || null;
      const newImageId = validatedData.image_id || null;
      if (currentImageId !== newImageId) {
        (submitData as any).image_id = newImageId;
      }
      
      if (Object.keys(submitData).length === 0) {
        showInfo("تغییری اعمال نشده است");
        return;
      }
      
      updateFeatureMutation.mutate(submitData);
    } catch (error: any) {
      if (error.errors || error.issues) {
        const fieldErrors: Record<string, string> = {};
        const errorsToProcess = error.errors || error.issues || [];
        errorsToProcess.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        showError("خطا در اعتبارسنجی فرم");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">

        <CardWithIcon
          icon={Settings}
          title="اطلاعات ویژگی ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
          </div>
        </CardWithIcon>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
        <Button 
          onClick={() => navigate(-1)} 
          className="mt-4"
        >
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">

      <form id="feature-edit-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-4 space-y-6">
            <CardWithIcon
              icon={Star}
              title="اطلاعات ویژگی ملک"
              iconBgColor="bg-yellow"
              iconColor="stroke-yellow-2"
              borderColor="border-b-yellow-1"
              className="hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="عنوان"
                    htmlFor="title"
                    required
                    error={errors.title}
                  >
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="عنوان ویژگی ملک"
                      required
                    />
                  </FormField>
                  <FormField
                    label="دسته‌بندی"
                    htmlFor="group"
                    error={errors.group}
                  >
                    <Input
                      id="group"
                      value={formData.group}
                      onChange={(e) => handleInputChange("group", e.target.value)}
                      placeholder="دسته‌بندی ویژگی"
                    />
                  </FormField>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                    <Item variant="default" size="default" className="py-5">
                      <ItemContent>
                        <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                        <ItemDescription>
                          با غیرفعال شدن، ویژگی ملک از لیست مدیریت نیز مخفی می‌شود.
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                        />
                      </ItemActions>
                    </Item>
                  </div>
                </div>
              </div>
            </CardWithIcon>
          </div>

          <div className="lg:col-span-2">
            <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
              <CardWithIcon
                icon={ImageIcon}
                title="تصویر/آیکون ویژگی"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
              >
                {selectedMedia ? (
                  <div className="relative w-full aspect-square overflow-hidden group border">
                    <img
                      src={mediaService.getMediaUrlFromObject(selectedMedia)}
                      alt={selectedMedia.alt_text || "تصویر ویژگی"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-static-b/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMediaModalOpen(true)}
                        className="mx-1"
                        type="button"
                      >
                        تغییر تصویر
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="mx-1"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsMediaModalOpen(true)}
                    className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
                  >
                    <UploadCloud className="w-12 h-12 text-font-s" />
                    <p className="mt-4 text-lg font-semibold">انتخاب تصویر/آیکون</p>
                    <p className="mt-1 text-sm text-font-s text-center">
                      برای انتخاب از کتابخانه کلیک کنید
                    </p>
                  </div>
                )}
              </CardWithIcon>
            </div>
          </div>
        </div>
      </form>

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleImageSelect}
        selectMultiple={false}
        initialFileType="image"
        showTabs={true}
        context="media_library"
      />

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="button"
          onClick={() => {
            const form = document.getElementById('feature-edit-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={updateFeatureMutation.isPending}
        >
          {updateFeatureMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال به‌روزرسانی...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              به‌روزرسانی ویژگی ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

