import { useState } from "react";
import { Card, CardContent } from "@/components/elements/Card";
import type { Blog } from "@/types/blog/blog";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { TruncatedText } from "@/components/elements/TruncatedText";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";
import { showSuccess, showError } from '@/core/toast';
import {
  CheckCircle2,
  XCircle,
  Star,
  Hash,
  Link as LinkIcon,
  Clock,
  FileText,
  Zap,
} from "lucide-react";

interface BlogSidebarProps {
  blog: Blog;
}

export function BlogSidebar({ blog }: BlogSidebarProps) {
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState(blog.is_public ?? true);
  const [isActive, setIsActive] = useState(blog.is_active ?? (blog.status === "published"));
  const [isFeatured, setIsFeatured] = useState(blog.is_featured ?? false);

  const mainImageUrl = blog.main_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: blog.main_image.file_url } as any)
    : null;


  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const updatePublicMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      return await blogApi.partialUpdateBlog(blog.id, { is_public: checked });
    },
    onSuccess: (data) => {
      setIsPublic(data.is_public ?? true);
      queryClient.invalidateQueries({ queryKey: ['blog', blog.id] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(`وضعیت نمایش عمومی با موفقیت به ${data.is_public ? 'فعال' : 'غیرفعال'} تغییر یافت`);
    },
    onError: (error) => {
      setIsPublic(!isPublic);
      showError(error, { customMessage: "خطا در تغییر وضعیت نمایش عمومی" });
    },
  });

  const updateActiveMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      return await blogApi.partialUpdateBlog(blog.id, { is_active: checked });
    },
    onSuccess: (data) => {
      setIsActive(data.is_active ?? true);
      queryClient.invalidateQueries({ queryKey: ['blog', blog.id] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(`وضعیت فعال با موفقیت به ${data.is_active ? 'فعال' : 'غیرفعال'} تغییر یافت`);
    },
    onError: (error) => {
      setIsActive(!isActive);
      showError(error, { customMessage: "خطا در تغییر وضعیت فعال" });
    },
  });

  const updateFeaturedMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      return await blogApi.partialUpdateBlog(blog.id, { is_featured: checked });
    },
    onSuccess: (data) => {
      setIsFeatured(data.is_featured ?? false);
      queryClient.invalidateQueries({ queryKey: ['blog', blog.id] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(`وضعیت ویژه با موفقیت به ${data.is_featured ? 'ویژه' : 'عادی'} تغییر یافت`);
    },
    onError: (error) => {
      setIsFeatured(!isFeatured);
      showError(error, { customMessage: "خطا در تغییر وضعیت ویژه" });
    },
  });

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md">
              {mainImageUrl ? (
                <MediaImage
                  media={{ file_url: mainImageUrl } as any}
                  alt={blog.title}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-1 to-purple-2 flex items-center justify-center text-static-w text-5xl font-bold">
                  {blog.title?.[0]?.toUpperCase() || "P"}
                </div>
              )}
            </div>
          </div>

          <div className="pb-6 pt-2 border-b -mx-6 px-6">
            <div className="grid grid-cols-3 gap-3">
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                blog.status === "published" ? "bg-green" : "bg-yellow"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  blog.status === "published" ? "bg-green-0" : "bg-yellow-0"
                }`}>
                  {blog.status === "published" ? (
                    <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                  ) : (
                    <XCircle className="w-4 h-4 stroke-yellow-2" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  blog.status === "published" ? "text-green-2" : "text-yellow-2"
                }`}>
                  {blog.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                isActive ? "bg-blue" : "bg-red"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  isActive ? "bg-blue-0" : "bg-red-0"
                }`}>
                  <Zap className={`w-4 h-4 ${
                    isActive ? "stroke-blue-2" : "stroke-red-2"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? "text-blue-2" : "text-red-2"
                }`}>
                  {isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                blog.is_featured ? "bg-orange" : "bg-gray"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  blog.is_featured ? "bg-orange-0" : "bg-gray-0"
                }`}>
                  <Star className={`w-4 h-4 ${
                    blog.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  blog.is_featured ? "text-orange-2" : "text-gray-1"
                }`}>
                  {blog.is_featured ? "ویژه" : "عادی"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-4">
            <div className="space-y-5">
            <div>
              <h4 className="mb-4 text-font-p">اطلاعات پایه</h4>
              <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>عنوان:</label>
                  </div>
                  <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                    <TruncatedText
                      text={blog.title}
                      maxLength={40}
                      className="text-font-p"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>شناسه:</label>
                  </div>
                  <p className="text-font-p text-left">
                    #{blog.id}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>نامک:</label>
                  </div>
                  <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                    <TruncatedText
                      text={blog.slug || "-"}
                      maxLength={35}
                      className="font-mono text-font-p"
                    />
                  </div>
                </div>

                {blog.created_at && (
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>تاریخ ایجاد:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {formatDate(blog.created_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="mb-4 text-font-p">تنظیمات</h4>
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
                  <Item variant="default" size="default" className="py-5">
                    <ItemContent>
                      <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                      <ItemDescription>
                        اگر غیرفعال باشد بلاگ در سایت نمایش داده نمی‌شود.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={isPublic}
                        disabled={updatePublicMutation.isPending}
                        onCheckedChange={(checked) => updatePublicMutation.mutate(checked)}
                      />
                    </ItemActions>
                  </Item>
                </div>
                
                <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                  <Item variant="default" size="default" className="py-5">
                    <ItemContent>
                      <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                      <ItemDescription>
                        با غیرفعال شدن، بلاگ از لیست مدیریت نیز مخفی می‌شود.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={isActive}
                        disabled={updateActiveMutation.isPending}
                        onCheckedChange={(checked) => updateActiveMutation.mutate(checked)}
                      />
                    </ItemActions>
                  </Item>
                </div>
                
                <div className="rounded-xl border border-orange-1/40 bg-orange-0/30 hover:border-orange-1/60 transition-colors overflow-hidden">
                  <Item variant="default" size="default" className="py-5">
                    <ItemContent>
                      <ItemTitle className="text-orange-2">وضعیت ویژه</ItemTitle>
                      <ItemDescription>
                        بلاگ‌های ویژه در بخش‌های خاص سایت با اولویت نمایش داده می‌شوند.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={isFeatured}
                        disabled={updateFeaturedMutation.isPending}
                        onCheckedChange={(checked) => updateFeaturedMutation.mutate(checked)}
                      />
                    </ItemActions>
                  </Item>
                </div>
              </div>
            </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

