import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { Media } from "@/types/shared/media";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { Star, Loader2, Save, Image as ImageIcon, UploadCloud, X, Settings, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { propertyFeatureFormSchema, propertyFeatureFormDefaults, type PropertyFeatureFormValues } from '@/components/real-estate/validations/featureSchema';

export default function CreatePropertyFeaturePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");
  
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const form = useForm<PropertyFeatureFormValues>({
    resolver: zodResolver(propertyFeatureFormSchema),
    defaultValues: propertyFeatureFormDefaults,
    mode: "onSubmit",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;

  const createFeatureMutation = useMutation({
    mutationFn: (data: Partial<PropertyFeature>) => realEstateApi.createFeature(data),
    onSuccess: () => {
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("created", { item: "ویژگی ملک" }));
      queryClient.invalidateQueries({ queryKey: ['property-features'] });
      navigate("/real-estate/features");
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof PropertyFeatureFormValues, {
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
    createFeatureMutation.mutate(data);
  });

  return (
    <div className="space-y-6 pb-28 relative">
      <form id="feature-create-form" onSubmit={handleSubmit} noValidate>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="account">
              <FileText className="h-4 w-4" />
              اطلاعات پایه
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="h-4 w-4" />
              مدیا
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
              تنظیمات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
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
                    <FormFieldInput
                      label="عنوان"
                      id="title"
                      required
                      error={errors.title?.message}
                      placeholder="عنوان ویژگی ملک"
                      {...register("title")}
                    />
                    <FormFieldInput
                      label="دسته‌بندی"
                      id="group"
                      error={errors.group?.message}
                      placeholder="دسته‌بندی ویژگی"
                      {...register("group")}
                    />
                  </div>
                </div>
              </CardWithIcon>
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="space-y-6">
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
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <CardWithIcon
                icon={Settings}
                title="تنظیمات"
                iconBgColor="bg-yellow"
                iconColor="stroke-yellow-2"
                borderColor="border-b-yellow-1"
                className="hover:shadow-lg transition-all duration-300"
              >
                <div className="space-y-6">
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
          </TabsContent>
        </Tabs>
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
          form="feature-create-form"
          size="lg"
          disabled={createFeatureMutation.isPending || isSubmitting}
        >
          {createFeatureMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد ویژگی ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

