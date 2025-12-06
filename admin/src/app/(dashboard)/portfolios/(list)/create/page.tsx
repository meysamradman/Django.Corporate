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
import { portfolioFormSchema, portfolioFormDefaults, PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { extractFieldErrors, hasFieldErrors, showSuccess, showError } from '@/core/toast';
import { getCrud, getStatus } from '@/core/messages';
import { env } from "@/core/config/environment";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { collectMediaFilesAndIds } from "@/components/portfolios/utils/portfolioMediaUtils";

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
  
  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema) as any,
    defaultValues: portfolioFormDefaults as any,
    mode: "onSubmit",
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: PortfolioFormValues & { status: "draft" | "published" }) => {
      const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(
        portfolioMedia,
        data.featuredImage
      );
      
      const uploadMax = env.PORTFOLIO_MEDIA_UPLOAD_MAX;
      const totalMedia = allMediaFiles.length + allMediaIds.length;
      if (totalMedia > uploadMax) {
        throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
      }
      
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
      
      if (allMediaIds.length > 0) {
        portfolioData.media_ids = allMediaIds;
      }
      
      let portfolio: Portfolio;
      if (allMediaFiles.length > 0) {
        portfolio = await portfolioApi.createPortfolioWithMedia(portfolioData, allMediaFiles);
      } else {
        portfolio = await portfolioApi.createPortfolio(portfolioData);
      }
      
      return portfolio;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      
      const successMessage = variables.status === "draft" 
        ? getCrud('saved', { item: 'نمونه‌کار درافت' })
        : getCrud('created', { item: 'نمونه‌کار' });
      showSuccess(successMessage);
      
      router.push("/portfolios");
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
        
        showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
      } else {
        showError(error);
      }
    },
  });

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    
    const data = form.getValues();
    createPortfolioMutation.mutate({
      ...data,
      status: "published" as const
    });
  };

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
