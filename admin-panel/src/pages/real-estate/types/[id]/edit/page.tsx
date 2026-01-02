import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo } from "@/core/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { Media } from "@/types/shared/media";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { Building, Loader2, Save, FolderTree, Home, FolderOpen, Folder, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditPropertyTypePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const typeId = Number(id);
  
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

  const getSelectedTypeDisplay = () => {
    if (!formData.parent_id) {
      return {
        name: "بدون والد (نوع مادر)",
        icon: Home,
        level: 0,
        badge: "پیش‌فرض"
      };
    }
    const selected = types?.data?.find(t => t.id === formData.parent_id);
    if (!selected) return null;
    
    return {
      name: selected.title,
      icon: (selected.level || 1) === 1 ? FolderOpen : Folder,
      level: selected.level || 1,
      badge: null
    };
  };

  const renderTypeOption = (type: PropertyType) => {
    const level = type.level || 1;
    const indentPx = (level - 1) * 24;
    const Icon = level === 1 ? FolderOpen : Folder;
    const isSelected = formData.parent_id === type.id;
    
    return (
      <SelectItem 
        key={type.id} 
        value={type.id.toString()}
        className="relative"
      >
        <div 
          className="flex items-center gap-3 w-full justify-end" 
          style={{ paddingRight: `${indentPx}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
            {level > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex gap-0.5">
                  {Array.from({ length: level - 1 }).map((_, idx) => (
                    <div key={idx} className="w-1 h-1 bg-font-s/30" />
                  ))}
                </div>
              </div>
            )}
            <span className={`flex-1 truncate text-right ${ isSelected ? 'font-medium text-foreground' : 'text-foreground'}`}>
              {type.title}
            </span>
          </div>
          {level > 1 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-border" />
          )}
          <Icon 
            className={`w-4 h-4 shrink-0 transition-colors ${
              isSelected 
                ? 'text-primary' 
                : level === 1 
                  ? 'text-primary/70' 
                  : 'text-font-s'
            }`} 
          />
        </div>
      </SelectItem>
    );
  };

  useEffect(() => {
    if (type) {
      setFormData({
        title: type.title || "",
        slug: type.slug || "",
        description: type.description || "",
        parent_id: (type as any).parent_id || null,
        display_order: type.display_order || 0,
        is_active: type.is_active,
      });
      
      if (type.image) {
        setSelectedMedia(type.image);
      }
    }
  }, [type]);

  const updateTypeMutation = useMutation({
    mutationFn: (data: Partial<PropertyType>) => realEstateApi.partialUpdateType(typeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-type', typeId] });
      queryClient.invalidateQueries({ queryKey: ['property-types'] });
      showSuccess("نوع ملک با موفقیت به‌روزرسانی شد");
      navigate("/real-estate/types");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در به‌روزرسانی نوع ملک";
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

  const handleParentChange = (value: string) => {
    const parentId = value && value !== "null" ? parseInt(value) : null;
    setFormData(prev => ({ ...prev, parent_id: parentId }));
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
    
    if (!type) return;
    
    const slugValidation = validateSlug(formData.slug, true);
    if (!slugValidation.isValid) {
      showError(slugValidation.error || "اسلاگ معتبر نیست");
      return;
    }
    
    const submitData: Partial<PropertyType> = {};
    
    if (formData.title !== type.title) {
      submitData.title = formData.title;
    }
    
    if (formData.slug !== type.slug) {
      submitData.slug = formData.slug;
    }
    
    if (formData.parent_id !== ((type as any).parent_id || null)) {
      submitData.parent_id = formData.parent_id;
    }
    
    if (formData.description !== (type.description || "")) {
      submitData.description = formData.description || "";
    }
    
    if (formData.display_order !== type.display_order) {
      submitData.display_order = formData.display_order;
    }
    
    if (formData.is_active !== type.is_active) {
      submitData.is_active = formData.is_active;
    }
    
    const currentImageId = type.image?.id || null;
    const newImageId = selectedMedia?.id || null;
    if (currentImageId !== newImageId) {
      (submitData as any).image_id = newImageId;
    }
    
    if (Object.keys(submitData).length === 0) {
      showInfo("تغییری اعمال نشده است");
      return;
    }
    
    updateTypeMutation.mutate(submitData);
  };

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

      <form id="type-edit-form" onSubmit={handleSubmit}>
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
              <Select
                value={formData.parent_id?.toString() || "null"}
                onValueChange={handleParentChange}
              >
                <SelectTrigger className="w-full h-auto min-h-[2.5rem] py-2 !justify-start">
                  <div className="flex items-center gap-3 w-full flex-1 min-w-0">
                    {(() => {
                      const display = getSelectedTypeDisplay();
                      if (!display) {
                        return (
                          <>
                            <SelectValue placeholder="نوع والد را انتخاب کنید" className="flex-1 text-right w-full" />
                            <div className="p-1.5 bg-bg/50 shrink-0">
                              <Home className="w-4 h-4 text-font-s" />
                            </div>
                          </>
                        );
                      }
                      const Icon = display.icon;
                      return (
                        <>
                          <SelectValue className="flex-1 text-right w-full">
                            <span className="font-medium truncate text-right block">{display.name}</span>
                          </SelectValue>
                          {display.badge && (
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-medium shrink-0">
                              {display.badge}
                            </span>
                          )}
                          <div className={`p-1.5 shrink-0 ${
                            display.level === 0 
                              ? 'bg-primary/10' 
                              : 'bg-bg/50'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              display.level === 0 
                                ? 'text-primary' 
                                : 'text-foreground'
                            }`} />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem 
                    value="null"
                    className="font-medium"
                  >
                    <div className="flex items-center gap-3 w-full justify-end">
                      <div className="flex items-center gap-2 flex-1 justify-end text-right">
                        <span>بدون والد (نوع مادر)</span>
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-medium">
                          پیش‌فرض
                        </span>
                      </div>
                      <div className="p-1.5 bg-primary/10 shrink-0">
                        <Home className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </SelectItem>
                  {types?.data && types.data.length > 0 && (
                    <>
                      <div className="h-px bg-border/50 my-2 mx-2" />
                      <div className="px-3 py-2 text-xs font-semibold text-font-s uppercase tracking-wide text-right">
                        نوع‌های موجود
                      </div>
                    </>
                  )}
                  {types?.data
                    ?.filter(t => t.id !== typeId)
                    .map((type) => renderTypeOption(type))}
                </SelectContent>
              </Select>
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
          type="button"
          onClick={() => {
            const form = document.getElementById('type-edit-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={updateTypeMutation.isPending}
        >
          {updateTypeMutation.isPending ? (
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

