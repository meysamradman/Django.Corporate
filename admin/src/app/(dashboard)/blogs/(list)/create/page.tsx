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
  Loader2, Save, Search, List
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
  
  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema) as any,
    defaultValues: blogFormDefaults as any,
        mode: "onSubmit",
  });

  const createBlogMutation = useMutation({
    mutationFn: async (data: BlogFormValues & { status: "draft" | "published" }) => {
      const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(
        blogMedia,
        data.featuredImage
      );
      
      const uploadMax = env.PORTFOLIO_MEDIA_UPLOAD_MAX;
      const totalMedia = allMediaFiles.length + allMediaIds.length;
      if (totalMedia > uploadMax) {
        throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
      }
      
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
      
      if (allMediaIds.length > 0) {
        blogData.media_ids = allMediaIds;
      }
      
      let blog: Blog;
      if (allMediaFiles.length > 0) {
        blog = await blogApi.createBlogWithMedia(blogData, allMediaFiles);
      } else {
        blog = await blogApi.createBlog(blogData);
      }
      
      return blog;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      
      const successMessage = variables.status === "draft" 
        ? msg.ui("blogDraftSaved")
        : msg.ui("blogCreated");
      showSuccessToast(successMessage);
      
      router.push("/blogs");
      router.push("/blogs");
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
          form.setError(formField as any, {
            type: 'server',
            message: message as string
          });
        });
        
        showErrorToast(error, "لطفاً خطاهای فرم را بررسی کنید");
      } else {
        showErrorToast(error);
      }
    },
  });

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    
    const data = form.getValues();
    createBlogMutation.mutate({
      ...data,
      status: "published" as const
    });
  };

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
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ایجاد وبلاگ جدید</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push("/blogs")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 />
              ویرایش
            </Button>
          )}
        </div>
      </div>

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

      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
          <Button 
            onClick={handleSaveDraft} 
            variant="outline" 
            size="lg"
            disabled={createBlogMutation.isPending}
          >
            {createBlogMutation.isPending ? (
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
            disabled={createBlogMutation.isPending}
          >
            {createBlogMutation.isPending ? (
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
