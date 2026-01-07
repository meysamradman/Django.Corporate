import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { Media } from "@/types/shared/media";
import { TreeSelect } from "@/components/elements/TreeSelect";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { propertyTypeFormSchema, propertyTypeFormDefaults, type PropertyTypeFormValues } from '@/components/real-estate/validations/typeSchema';
import { mediaService } from "@/components/media/services";
import { Building, Loader2, Save, FolderTree, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditPropertyTypePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const typeId = Number(id);
  
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const form = useForm<PropertyTypeFormValues>({
    resolver: zodResolver(propertyTypeFormSchema) as any,
    defaultValues: propertyTypeFormDefaults as any,
    mode: "onSubmit",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;
  const titleValue = watch("title");

  // Auto-generate slug from title
  useEffect(() => {
    if (titleValue) {
      const generatedSlug = generateSlug(titleValue);
      setValue("slug", generatedSlug, { shouldValidate: false });
    }
  }, [titleValue, setValue]);

  const { data: type, isLoading, error } = useQuery({
    queryKey: ['property-type', typeId],
    queryFn: () => realEstateApi.getTypeById(typeId),
    enabled: !!typeId,
  });

  const { data: types } = useQuery({
    queryKey: ['property-types-all'],
    queryFn: async () => {
      return await realEstateApi.getTypes({ size: 1000 });
    },
    staleTime: 0,
    gcTime: 0,
  });

  // Reset form with type data
  useEffect(() => {
    if (type) {
      form.reset({
        title: type.title || "",
        slug: type.slug || "",
        description: type.description || "",
        parent_id: (type as any).parent_id || null,
        display_order: type.display_order || 0,
        is_active: type.is_active ?? true,
        image_id: type.image?.id || null,
      });
      
      if (type.image) {
        setSelectedMedia(type.image);
      }
    }
  }, [type, form]);

  const updateTypeMutation = useMutation({
    mutationFn: (data: Partial<PropertyType>) => realEstateApi.partialUpdateType(typeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-type', typeId] });
      queryClient.invalidateQueries({ queryKey: ['property-types'] });
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("updated", { item: "نوع ملک" }));
      navigate("/real-estate/types");
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          const fieldMap: Record<string, any> = {
            'title': 'title',
            'slug': 'slug',
            'description': 'description',
            'parent_id': 'parent_id',
            'display_order': 'display_order',
            'is_active': 'is_active',
            'image_id': 'image_id',
          };
          
          const formField = fieldMap[field] || field;
          form.setError(formField as any, {
            type: 'server',
            message: message as string
          });
        });
        
        // Toast کلی برای راهنمایی کاربر
        showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
      } 
      // ✅ General Errors → فقط Toast
      else {
        // showError خودش تصمیم می‌گیرد (بک‌اند یا frontend)
        showError(error);
      }
    },
  });

  const handleImageSelect = (media: Media | Media[] | null) => {
    const selected = Array.isArray(media) ? media[0] || null : media;
    setSelectedMedia(selected);
    setValue("image_id", selected?.id || null, { shouldValidate: false });
    setIsMediaModalOpen(false);
  };

  const handleRemoveImage = () => {
    setSelectedMedia(null);
    setValue("image_id", null, { shouldValidate: false });
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!type) return;
    
    // ✅ حفظ منطق: فقط فیلدهایی که تغییر کرده‌اند را ارسال کن
    const submitData: Partial<PropertyType> = {};
    
    if (data.title !== type.title) {
      submitData.title = data.title;
    }
    
    if (data.slug !== type.slug) {
      submitData.slug = data.slug;
    }
    
    if (data.parent_id !== ((type as any).parent_id || null)) {
      submitData.parent_id = data.parent_id;
    }
    
    if (data.description !== (type.description || "")) {
      submitData.description = data.description || "";
    }
    
    if (data.display_order !== (type.display_order || 0)) {
      submitData.display_order = data.display_order;
    }
    
    if (data.is_active !== (type.is_active ?? true)) {
      submitData.is_active = data.is_active;
    }
    
    const currentImageId = type.image?.id || null;
    const newImageId = data.image_id || null;
    if (currentImageId !== newImageId) {
      (submitData as any).image_id = newImageId;
    }
    
    if (Object.keys(submitData).length === 0) {
      showInfo("تغییری اعمال نشده است");
      return;
    }
    
    updateTypeMutation.mutate(submitData);
  });

  // Map types to match TreeSelect expected format (title -> name)
  const treeData = types?.data
    ?.filter(t => t.id !== typeId)
    ?.map(t => ({
      ...t,
      name: t.title
    })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">

        <CardWithIcon
          icon={Building}
          title="اطلاعات نوع ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
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

      <form id="type-edit-form" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-4 space-y-6">
            <CardWithIcon
              icon={FolderTree}
              title="اطلاعات نوع ملک"
              iconBgColor="bg-purple"
              iconColor="stroke-purple-2"
              borderColor="border-b-purple-1"
              className="hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldInput
                    label="عنوان"
                    id="title"
                    required
                    error={errors.title?.message}
                    placeholder="عنوان نوع ملک"
                    {...register("title")}
                  />
                  <FormFieldInput
                    label="نامک"
                    id="slug"
                    required
                    error={errors.slug?.message}
                    placeholder="نامک"
                    {...register("slug", {
                      onChange: (e) => {
                        const formattedSlug = formatSlug(e.target.value);
                        e.target.value = formattedSlug;
                        setValue("slug", formattedSlug);
                      }
                    })}
                  />
                </div>

                <FormField
                  label="نوع والد"
                  htmlFor="parent_id"
                  description="نوع‌های بدون والد، نوع‌های مادر هستند."
                  error={errors.parent_id?.message}
                >
                  <TreeSelect
                    data={treeData}
                    value={watch("parent_id") || null}
                    onChange={(value) => setValue("parent_id", value ? parseInt(value) : null)}
                    placeholder="انتخاب نوع والد (اختیاری)"
                    searchPlaceholder="جستجوی نوع ملک..."
                    emptyText="نوع ملکی یافت نشد"
                  />
                </FormField>

                <FormFieldTextarea
                  label="توضیحات"
                  id="description"
                  error={errors.description?.message}
                  placeholder="توضیحات نوع ملک"
                  rows={4}
                  {...register("description")}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldInput
                    label="ترتیب نمایش"
                    id="display_order"
                    type="number"
                    error={errors.display_order?.message}
                    placeholder="ترتیب نمایش"
                    {...register("display_order", { valueAsNumber: true })}
                  />
                </div>

                <div className="mt-6 space-y-4">
                  <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                    <Item variant="default" size="default" className="py-5">
                      <ItemContent>
                        <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                        <ItemDescription>
                          با غیرفعال شدن، نوع ملک از لیست مدیریت نیز مخفی می‌شود.
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Switch
                          checked={watch("is_active")}
                          onCheckedChange={(checked) => setValue("is_active", checked)}
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
                title="تصویر نوع ملک"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
              >
                {selectedMedia ? (
                  <div className="relative w-full aspect-video overflow-hidden group border">
                    <img
                      src={mediaService.getMediaUrlFromObject(selectedMedia)}
                      alt={selectedMedia.alt_text || "تصویر نوع ملک"}
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
                    <p className="mt-4 text-lg font-semibold">انتخاب تصویر</p>
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
          type="submit"
          form="type-edit-form"
          size="lg"
          disabled={updateTypeMutation.isPending || isSubmitting}
        >
          {updateTypeMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال به‌روزرسانی...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              به‌روزرسانی نوع ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
