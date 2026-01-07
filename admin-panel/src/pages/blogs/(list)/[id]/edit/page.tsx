import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import {
  FileText, Image, Search,
  Loader2, Save, Settings
} from "lucide-react";
import { blogApi } from "@/api/blogs/blogs";
import { formatSlug } from '@/core/slug/generate';
import { showError, showSuccess } from '@/core/toast';
import { extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { msg } from '@/core/messages';
import type { BlogMedia } from "@/types/blog/blogMedia";
import { collectMediaFilesAndIds, collectMediaIds, collectMediaCovers, parseBlogMedia } from "@/components/blogs/utils/blogMediaUtils";
import type { BlogUpdateData } from "@/types/blog/blog";
import { blogFormSchema, blogFormDefaults, type BlogFormValues } from "@/components/blogs/validations/blogSchema";
import { env } from "@/core/config/environment";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="border border-br overflow-hidden">
          <div className="border-b border-b-blue-1 bg-bg/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-blue">
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
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <div className="border border-br overflow-hidden lg:sticky lg:top-20">
          <div className="border-b border-b-blue-1 bg-bg/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-blue">
                <Settings className="h-5 w-5 stroke-blue-2" />
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
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BaseInfoTab = lazy(() => import("@/components/blogs/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/blogs/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/blogs/list/create/SEOTab"));

export default function EditBlogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, _setEditMode] = useState(true);
  const [blogMedia, setBlogMedia] = useState<BlogMedia>({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
  });

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: blogFormDefaults,
    mode: "onSubmit",
  });

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogApi.getBlogById(Number(id!)),
    enabled: !!id,
  });

  // پر کردن فرم با داده موجود
  useEffect(() => {
    if (blog) {
      form.reset({
        name: blog.title || "",
        slug: blog.slug || "",
        short_description: blog.short_description || "",
        description: blog.description || "",
        selectedCategories: blog.categories || [],
        selectedTags: blog.tags || [],
        featuredImage: blog.main_image || null,
        meta_title: blog.meta_title || "",
        meta_description: blog.meta_description || "",
        og_title: blog.og_title || "",
        og_description: blog.og_description || "",
        og_image: blog.og_image || null,
        canonical_url: blog.canonical_url || "",
        robots_meta: blog.robots_meta || "",
        is_public: blog.is_public ?? true,
        is_active: blog.is_active ?? true,
        is_featured: blog.is_featured ?? false,
      });

      if (blog.blog_media) {
        const parsedMedia = parseBlogMedia(blog.blog_media);
        setBlogMedia(parsedMedia);
      }
    }
  }, [blog, form]);

  const updateBlogMutation = useMutation({
    mutationFn: async (data: BlogFormValues & { status: "draft" | "published" }) => {
      if (!blog) throw new Error("Blog not found");

      const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(
        blogMedia,
        data.featuredImage
      );

      const uploadMax = env.BLOG_MEDIA_UPLOAD_MAX;
      const totalMedia = allMediaFiles.length + allMediaIds.length;
      if (totalMedia > uploadMax) {
        throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
      }

      const categoryIds = data.selectedCategories ? data.selectedCategories.map((cat: any) => typeof cat === 'number' ? cat : cat.id) : [];
      const tagIds = data.selectedTags ? data.selectedTags.map((tag: any) => typeof tag === 'number' ? tag : tag.id) : [];

      const existingMediaIds = collectMediaIds(blogMedia);
      const mainImageId = data.featuredImage?.id || blogMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(blogMedia);

      const updateData: BlogUpdateData = {
        title: data.name,
        slug: formatSlug(data.slug),
        short_description: data.short_description || "",
        description: data.description || "",
        status: data.status,
        is_featured: data.is_featured ?? false,
        is_public: data.is_public ?? true,
        is_active: data.is_active ?? true,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        og_title: data.og_title || undefined,
        og_description: data.og_description || undefined,
        og_image_id: data.og_image?.id || undefined,
        canonical_url: data.canonical_url || undefined,
        robots_meta: data.robots_meta || undefined,
        categories_ids: categoryIds,
        tags_ids: tagIds,
        media_ids: allMediaIds.length > 0 ? allMediaIds : existingMediaIds,
        main_image_id: mainImageId,
        media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
      };

      if (allMediaFiles.length > 0) {
        await blogApi.updateBlog(blog.id, updateData);
        return await blogApi.addMediaToBlog(blog.id, allMediaFiles, allMediaIds);
      } else {
        return await blogApi.updateBlog(blog.id, updateData);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', id] });

      const successMessage = variables.status === "draft"
        ? msg.crud('saved', { item: 'پیش‌نویس بلاگ' })
        : msg.crud('updated', { item: 'بلاگ' });
      showSuccess(successMessage);

      navigate("/blogs");
    },
    onError: (error: any) => {
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);

        Object.entries(fieldErrors).forEach(([field, message]) => {
          const fieldMap: Record<string, any> = {
            'title': 'name',
            'categories_ids': 'selectedCategories',
            'tags_ids': 'selectedTags',
          };

          const formField = fieldMap[field] || field;
          form.setError(formField as keyof BlogFormValues, {
            type: 'server',
            message: message as string
          });
        });

        showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
      } else {
        showError(error);
      }
    },
  });

  const handleSave = form.handleSubmit(async (data) => {
    updateBlogMutation.mutate({
      ...data,
      status: "published" as const
    });
  });

  const handleSaveDraft = form.handleSubmit(async (data) => {
    updateBlogMutation.mutate({
      ...data,
      status: "draft" as const
    });
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="account">
              <FileText className="h-4 w-4" />
              اطلاعات پایه
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

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="space-y-6">
                <div className="border border-br overflow-hidden">
                  <div className="border-b border-b-blue-1 bg-bg/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center bg-blue">
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
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[420px] lg:flex-shrink-0">
              <div className="border border-br overflow-hidden lg:sticky lg:top-20">
                <div className="border-b border-b-blue-1 bg-bg/50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-blue">
                      <Settings className="h-5 w-5 stroke-blue-2" />
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
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">وبلاگ مورد نظر یافت نشد.</p>
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
              form={form}
              editMode={editMode}
              blogId={id}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="media">
          <Suspense fallback={<TabSkeleton />}>
            <MediaTab
              form={form}
              blogMedia={blogMedia}
              setBlogMedia={setBlogMedia}
              editMode={editMode}
              blogId={id}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="seo">
          <Suspense fallback={<TabSkeleton />}>
            <SEOTab
              form={form}
              editMode={editMode}
              blogId={id}
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
            disabled={updateBlogMutation.isPending || form.formState.isSubmitting}
          >
            {updateBlogMutation.isPending || form.formState.isSubmitting ? (
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
            disabled={updateBlogMutation.isPending || form.formState.isSubmitting}
          >
            {updateBlogMutation.isPending || form.formState.isSubmitting ? (
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
