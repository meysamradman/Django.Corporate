"use client";

import { useState, lazy, Suspense } from "react";
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
import { Media } from "@/types/shared/media";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { portfolioFormSchema, portfolioFormDefaults, PortfolioFormValues } from "@/core/validations/portfolioSchema";
import { extractFieldErrors, hasFieldErrors } from "@/core/config/errorHandler";
import { showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";
import { env } from "@/core/config/environment";

// Add this interface for managing multiple media selections
interface PortfolioMedia {
  featuredImage: Media | null;
  imageGallery: Media[];
  videoGallery: Media[];
  audioGallery: Media[];
  pdfDocuments: Media[];
}

const BaseInfoTab = lazy(() => import("@/components/portfolios/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/portfolios/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/portfolios/list/create/SEOTab"));

export default function CreatePortfolioPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, setEditMode] = useState(true);
  const [portfolioMedia, setPortfolioMedia] = useState<PortfolioMedia>({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
  });
  
  // React Hook Form با Zod validation
  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema) as any,
    defaultValues: portfolioFormDefaults as any,
    mode: "onSubmit", // Validation فقط موقع submit
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: PortfolioFormValues & { status: "draft" | "published" }) => {
      // Prepare media data first
      const allMediaFiles: File[] = [];
      const allMediaIds: number[] = [];
      
      // Collect media files and IDs
      // Featured Image از form state
      if (data.featuredImage?.id) {
        allMediaIds.push(data.featuredImage.id);
      }
      
      // سایر media ها از portfolioMedia
      if (portfolioMedia.featuredImage && portfolioMedia.featuredImage.id !== data.featuredImage?.id) {
        if ((portfolioMedia.featuredImage as any).file instanceof File) {
          allMediaFiles.push((portfolioMedia.featuredImage as any).file);
        } else if (portfolioMedia.featuredImage.id) {
          allMediaIds.push(portfolioMedia.featuredImage.id);
        }
      }
      
      portfolioMedia.imageGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          allMediaFiles.push((media as any).file);
        } else if (media.id) {
          allMediaIds.push(media.id);
        }
      });
      
      portfolioMedia.videoGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          allMediaFiles.push((media as any).file);
        } else if (media.id) {
          allMediaIds.push(media.id);
        }
      });
      
      portfolioMedia.audioGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          allMediaFiles.push((media as any).file);
        } else if (media.id) {
          allMediaIds.push(media.id);
        }
      });
      
      portfolioMedia.pdfDocuments.forEach(media => {
        if ((media as any).file instanceof File) {
          allMediaFiles.push((media as any).file);
        } else if (media.id) {
          allMediaIds.push(media.id);
        }
      });
      
      // Validate upload limit from environment
      const uploadMax = env.PORTFOLIO_MEDIA_UPLOAD_MAX;
      const totalMedia = allMediaFiles.length + allMediaIds.length;
      if (totalMedia > uploadMax) {
        throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
      }
      
      // Create portfolio with media_ids in single request (if we have media IDs)
      // If we have files, we need to send them separately after creation
      const portfolioData: any = {
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
        categories_ids: data.selectedCategory ? [parseInt(data.selectedCategory)] : [],
        tags_ids: data.selectedTags.map(tag => tag.id),
        options_ids: data.selectedOptions.map(option => option.id),
      };
      
      // Always include media_ids in portfolio data if we have any
      if (allMediaIds.length > 0) {
        portfolioData.media_ids = allMediaIds;
      }
      
      // Create portfolio - if we have files, use FormData, otherwise use JSON
      let portfolio: Portfolio;
      if (allMediaFiles.length > 0) {
        // If we have files, use FormData and send everything together
        portfolio = await portfolioApi.createPortfolioWithMedia(portfolioData, allMediaFiles);
      } else {
        // No files, just send JSON with media_ids
        portfolio = await portfolioApi.createPortfolio(portfolioData);
      }
      
      return portfolio;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      
      // نمایش پیام موفقیت
      const successMessage = variables.status === "draft" 
        ? msg.ui("portfolioDraftSaved")
        : msg.ui("portfolioCreated");
      showSuccessToast(successMessage);
      
      // انتقال به صفحه لیست
      router.push("/portfolios");
    },
    onError: (error: any) => {
      console.error("Error creating portfolio:", error);
      
      // بررسی خطاهای فیلدها از Django
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        // Set کردن خطاها در فرم
        Object.entries(fieldErrors).forEach(([field, message]) => {
          // Map کردن field names از Django به React Hook Form
          const fieldMap: Record<string, any> = {
            'title': 'name',
            'categories_ids': 'selectedCategory',
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
    createPortfolioMutation.mutate({
      ...data,
      status: "published" as const
    });
  };

  // Handler برای ذخیره پیش‌نویس
  const handleSaveDraft = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    
    const data = form.getValues();
    createPortfolioMutation.mutate({
      ...data,
      status: "draft" as const
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ایجاد نمونه‌کار جدید</h1>
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
              <Button onClick={handleSaveDraft} variant="outline" disabled={createPortfolioMutation.isPending}>
                {createPortfolioMutation.isPending ? (
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
              <Button onClick={handleSave} disabled={createPortfolioMutation.isPending}>
                {createPortfolioMutation.isPending ? (
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

        <Suspense fallback={
          <div className="mt-6">
            <Skeleton className="w-full h-64" />
            <Skeleton className="w-full h-64 mt-4" />
          </div>
        }>
          {activeTab === "account" && (
            <BaseInfoTab 
              form={form as any}
              editMode={editMode}
            />
          )}
          {activeTab === "media" && (
            <MediaTab 
              form={form as any}
              portfolioMedia={portfolioMedia}
              setPortfolioMedia={setPortfolioMedia}
              editMode={editMode}
            />
          )}
          {activeTab === "seo" && (
            <SEOTab 
              form={form as any}
              editMode={editMode}
            />
          )}
        </Suspense>
      </Tabs>
    </div>
  );
}
