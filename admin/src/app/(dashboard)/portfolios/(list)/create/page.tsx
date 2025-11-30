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
import { portfolioApi } from "@/api/portfolios/route";
import { portfolioFormSchema, portfolioFormDefaults, PortfolioFormValues } from "@/core/validations/portfolioSchema";
import { extractFieldErrors, hasFieldErrors } from "@/core/config/errorHandler";
import { showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";
import { env } from "@/core/config/environment";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { collectMediaFilesAndIds } from "@/core/utils/portfolioMediaUtils";

import BaseInfoTab from "@/components/portfolios/list/create/BaseInfoTab";
import MediaTab from "@/components/portfolios/list/create/MediaTab";
import SEOTab from "@/components/portfolios/list/create/SEOTab";

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
      // Collect media files and IDs using utility function
      const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(
        portfolioMedia,
        data.featuredImage
      );
      
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
        categories_ids: data.selectedCategories ? data.selectedCategories.map((cat: any) => typeof cat === 'number' ? cat : cat.id) : [],
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
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ایجاد نمونه‌کار جدید</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push("/portfolios")}
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
      </Tabs>

      {/* Sticky Save Buttons Footer */}
      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
          <Button 
            onClick={handleSaveDraft} 
            variant="outline" 
            size="lg"
            disabled={createPortfolioMutation.isPending}
          >
            {createPortfolioMutation.isPending ? (
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
            disabled={createPortfolioMutation.isPending}
          >
            {createPortfolioMutation.isPending ? (
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
