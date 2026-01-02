import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { 
  FileText, Image, 
  Loader2, Save, Search, Settings
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { portfolioFormSchema, portfolioFormDefaults, type PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { extractFieldErrors, hasFieldErrors, showSuccess, showError } from '@/core/toast';
import { getCrud } from '@/core/messages';
import { env } from "@/core/config/environment";
import type { Portfolio } from "@/types/portfolio/portfolio";
import type { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { collectMediaFilesAndIds } from "@/components/portfolios/utils/portfolioMediaUtils";
import AdminTabsFormWrapper from "@/components/elements/AdminTabsFormWrapper";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <CardWithIcon
          icon={FileText}
          title="اطلاعات پایه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
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
        </CardWithIcon>
      </div>

      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <CardWithIcon
          icon={Settings}
          title="تنظیمات"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          className="lg:sticky lg:top-20"
        >
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
        </CardWithIcon>
      </div>
    </div>
  </div>
);

const BaseInfoTab = lazy(() => import("@/components/portfolios/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/portfolios/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/portfolios/list/create/SEOTab"));
const ExtraAttributesTab = lazy(() => import("@/components/portfolios/list/create/ExtraAttributesTab"));

export default function CreatePortfolioPage() {
  const navigate = useNavigate();
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
        is_featured: data.is_featured ?? false,
        is_public: data.is_public ?? true,
        is_active: data.is_active ?? true,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        og_title: data.og_title || undefined,
        og_description: data.og_description || undefined,
        og_image: data.og_image?.id || undefined,
        canonical_url: data.canonical_url || undefined,
        robots_meta: data.robots_meta || undefined,
        extra_attributes: data.extra_attributes || {},
        categories_ids: data.selectedCategories ? data.selectedCategories.map((cat: any) => typeof cat === 'number' ? cat : cat.id) : [],
        tags_ids: data.selectedTags ? data.selectedTags.map(tag => tag.id) : [],
        options_ids: data.selectedOptions ? data.selectedOptions.map(option => option.id) : [],
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      
      const successMessage = variables.status === "draft" 
        ? getCrud('saved', { item: 'نمونه‌کار درافت' })
        : getCrud('created', { item: 'نمونه‌کار' });
      showSuccess(successMessage);
      
      navigate("/portfolios");
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
      <AdminTabsFormWrapper
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={
          <>
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
              <TabsTrigger value="extra">
                <Settings className="h-4 w-4" />
                فیلدهای اضافی
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Suspense fallback={<TabSkeleton />}>
                <BaseInfoTab 
                  form={form as any}
                  editMode={editMode}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="media">
              <Suspense fallback={<TabSkeleton />}>
                <MediaTab 
                  form={form as any}
                  portfolioMedia={portfolioMedia}
                  setPortfolioMedia={setPortfolioMedia}
                  editMode={editMode}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="seo">
              <Suspense fallback={<TabSkeleton />}>
                <SEOTab 
                  form={form as any}
                  editMode={editMode}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="extra">
              <Suspense fallback={<TabSkeleton />}>
                <ExtraAttributesTab 
                  form={form as any}
                  editMode={editMode}
                />
              </Suspense>
            </TabsContent>
          </>
        }
        saveBar={{
          onSave: handleSave,
          isSaving: createPortfolioMutation.isPending,
          leftChildren: (
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
          )
        }}
      >
      </AdminTabsFormWrapper>
    </div>
  );
}
