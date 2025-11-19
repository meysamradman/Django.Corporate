"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { 
  FileText, Edit2, Image, 
  Loader2, Save, Search
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/route";
import { blogFormSchema, blogFormDefaults, BlogFormValues } from "@/core/validations/blogSchema";
import { extractFieldErrors, hasFieldErrors } from "@/core/config/errorHandler";
import { showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";
import { env } from "@/core/config/environment";
import { Blog } from "@/types/blog/blog";
import { BlogMedia } from "@/types/blog/blogMedia";
import { collectMediaFilesAndIds } from "@/core/utils/blogMediaUtils";

import BaseInfoTab from "@/components/blogs/list/create/BaseInfoTab";
import MediaTab from "@/components/blogs/list/create/MediaTab";
import SEOTab from "@/components/blogs/list/create/SEOTab";

export default function CreateBlogPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, setEditMode] = useState(true);
  const [blogMedia, setBlogMedia] = useState<BlogMedia>({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
  });
  
  // React Hook Form با Zod validation
  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema) as any,
    defaultValues: blogFormDefaults as any,
    mode: "onSubmit", // Validation فقط موقع submit
  });

  const createBlogMutation = useMutation({
    mutationFn: async (data: BlogFormValues & { status: "draft" | "published" }) => {
      // Collect media files and IDs using utility function
      const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(
        blogMedia,
        data.featuredImage
      );
      
      // Validate upload limit from environment
      const uploadMax = env.PORTFOLIO_MEDIA_UPLOAD_MAX;
      const totalMedia = allMediaFiles.length + allMediaIds.length;
      if (totalMedia > uploadMax) {
        throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
      }
      
      // Create blog with media_ids in single request (if we have media IDs)
      // If we have files, we need to send them separately after creation
      const blogData: any = {
        title: data.name,
        slug: data.slug,
        short_description: data.short_description || "",
        description: data.description || "",
        status: data.status as "draft" | "published",
        is_featured: false,
        is_public: true,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        og_title: data.og_title || undefined,
        og_description: data.og_description || undefined,
        og_image: data.og_image?.id || undefined,
        canonical_url: data.canonical_url || undefined,
        robots_meta: data.robots_meta || undefined,
        categories_ids: data.selectedCategories ? data.selectedCategories.map((cat: any) => typeof cat === 'number' ? cat : cat.id) : [],
        tags_ids: data.selectedTags.map(tag => tag.id),
      };
      
      // Always include media_ids in blog data if we have any
      if (allMediaIds.length > 0) {
        blogData.media_ids = allMediaIds;
      }
      
      // Create blog - if we have files, use FormData, otherwise use JSON
      let blog: Blog;
      if (allMediaFiles.length > 0) {
        // If we have files, use FormData and send everything together
        blog = await blogApi.createBlogWithMedia(blogData, allMediaFiles);
      } else {
        // No files, just send JSON with media_ids
        blog = await blogApi.createBlog(blogData);
      }
      
      return blog;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      
      // نمایش پیام موفقیت
      const successMessage = variables.status === "draft" 
        ? msg.ui("blogDraftSaved")
        : msg.ui("blogCreated");
      showSuccessToast(successMessage);
      
      // انتقال به صفحه لیست
      router.push("/blogs");
      router.push("/blogs");
    },
    onError: (error: any) => {
      
      // بررسی خطاهای فیلدها از Django
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        // Set کردن خطاها در فرم
        Object.entries(fieldErrors).forEach(([field, message]) => {
          // Map کردن field names از Django به React Hook Form
          const fieldMap: Record<string, any> = {
            'title': 'name',
            'categories_ids': 'selectedCategories',
            'tags_ids': 'selectedTags',
          };
          
          const formField = fieldMap[field] || field;
          form.setError(formField as any, {
            type: 'server',
            message: message as string
          });
        });
        
        // نمایش پیام خطای کلی
        showErrorToast(error, "لطفاً خطاهای فرم را بررسی کنید");
      } else {
        // نمایش خطای عمومی
        showErrorToast(error);
      }
    },
  });

  // Handler برای ذخیره فرم
  const handleSave = async () => {
    // Validation اتوماتیک توسط Zod انجام می‌شود
    const isValid = await form.trigger();
    if (!isValid) return;
    
    const data = form.getValues();
    createBlogMutation.mutate({
      ...data,
      status: "published" as const
    });
  };

  // Handler برای ذخیره پیش‌نویس
  const handleSaveDraft = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    
    const data = form.getValues();
    createBlogMutation.mutate({
      ...data,
      status: "draft" as const
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ایجاد وبلاگ جدید</h1>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 />
              ویرایش
            </Button>
          )}
          {editMode && (
            <>
              <Button onClick={handleSaveDraft} variant="outline" disabled={createBlogMutation.isPending}>
                {createBlogMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save />
                    ذخیره پیش‌نویس
                  </>
                )}
              </Button>
              <Button onClick={handleSave} disabled={createBlogMutation.isPending}>
                {createBlogMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save />
                    ذخیره
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="account">
            <FileText className="h-4 w-4 me-2" />
            اطلاعات پایه
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="h-4 w-4 me-2" />
            مدیا
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="h-4 w-4 me-2" />
            سئو
          </TabsTrigger>
        </TabsList>

        {activeTab === "account" && (
          <BaseInfoTab 
            form={form as any}
            editMode={editMode}
          />
        )}
        {activeTab === "media" && (
          <MediaTab 
            form={form as any}
            blogMedia={blogMedia}
            setBlogMedia={setBlogMedia}
            editMode={editMode}
          />
        )}
        {activeTab === "seo" && (
          <SEOTab 
            form={form as any}
            editMode={editMode}
          />
        )}
      </Tabs>
    </div>
  );
}
