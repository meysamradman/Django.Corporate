import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess } from "@/core/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { Media } from "@/types/shared/media";
import { TreeSelect } from "@/components/elements/TreeSelect";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { Loader2, Save, FolderTree, Image as ImageIcon, UploadCloud, X } from "lucide-react";

export default function CreatePropertyTypePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    parent_id: null as number | null,
    display_order: 0,
    is_active: true,
  });

  const { data: types } = useQuery({
    queryKey: ['property-types-all'],
    queryFn: async () => {
      const res = await realEstateApi.getTypes({ size: 1000 });
      return res;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const createTypeMutation = useMutation({
    mutationFn: (data: Partial<PropertyType>) => realEstateApi.createType(data),
    onSuccess: () => {
      showSuccess("نوع ملک با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ['property-types'] });
      navigate("/real-estate/types");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail ||
        error?.response?.data?.metaData?.message ||
        "خطا در ایجاد نوع ملک";
      showError(errorMessage);
    },
  });

  const handleInputChange = (field: string, value: string | boolean | number | null) => {
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

    if (!formData.title.trim()) {
      showError("عنوان الزامی است");
      return;
    }

    const slugValidation = validateSlug(formData.slug, true);
    if (!slugValidation.isValid) {
      showError(slugValidation.error || "اسلاگ معتبر نیست");
      return;
    }

    const formDataWithImage = {
      ...formData,
      ...(selectedMedia?.id && { image_id: selectedMedia.id })
    };

    createTypeMutation.mutate(formDataWithImage);
  };

  // Map types to match TreeSelect expected format (title -> name)
  const treeData = types?.data?.map(t => ({
    ...t,
    name: t.title
  })) || [];

  return (
    <div className="space-y-6 pb-28 relative">

      <form id="type-create-form" onSubmit={handleSubmit}>
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
                  <FormField
                    label="عنوان"
                    htmlFor="title"
                    required
                  >
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="عنوان نوع ملک"
                      required
                    />
                  </FormField>
                  <FormField
                    label="نامک"
                    htmlFor="slug"
                    required
                  >
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange("slug", e.target.value)}
                      placeholder="نامک"
                      required
                    />
                  </FormField>
                </div>

                <FormField
                  label="نوع والد"
                  htmlFor="parent_id"
                  description="نوع‌های بدون والد، نوع‌های مادر هستند."
                >
                  <TreeSelect
                    data={treeData}
                    value={formData.parent_id || null}
                    onChange={(value) => handleInputChange("parent_id", value ? parseInt(value) : null)}
                    placeholder="انتخاب نوع والد (اختیاری)"
                    searchPlaceholder="جستجوی نوع ملک..."
                    emptyText="نوع ملکی یافت نشد"
                  />
                </FormField>

                <FormField
                  label="توضیحات"
                  htmlFor="description"
                >
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="توضیحات نوع ملک"
                    rows={4}
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="ترتیب نمایش"
                    htmlFor="display_order"
                  >
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => handleInputChange("display_order", parseInt(e.target.value) || 0)}
                      placeholder="ترتیب نمایش"
                    />
                  </FormField>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                    <Item variant="default" size="default" className="py-5">
                      <ItemContent>
                        <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                        <ItemDescription>
                          با غیرفعال شدن، نوع ملک از لیست مدیریت نیز مخفی می‌شود.
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
                title="تصویر نوع ملک"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
              >
                {selectedMedia ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
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
                    className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
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
          type="button"
          onClick={() => {
            const form = document.getElementById('type-create-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={createTypeMutation.isPending}
        >
          {createTypeMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد نوع ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

