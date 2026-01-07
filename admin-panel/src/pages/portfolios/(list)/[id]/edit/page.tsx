import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/elements/Button";
import { TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { 
  FileText, Image, Search,
  Loader2, Save, Settings
} from "lucide-react";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { formatSlug } from '@/core/slug/generate';
import { showError, showSuccess } from '@/core/toast';
import { extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { msg } from '@/core/messages';
import type { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { collectMediaFilesAndIds, collectMediaIds, collectMediaCovers, parsePortfolioMedia } from "@/components/portfolios/utils/portfolioMediaUtils";
import type { PortfolioUpdateData } from "@/types/portfolio/portfolio";
import { portfolioFormSchema, portfolioFormDefaults, type PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { env } from "@/core/config/environment";
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

export default function EditPortfolioPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, _setEditMode] = useState(true);
  const [portfolioMedia, setPortfolioMedia] = useState<PortfolioMedia>({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
  });

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: portfolioFormDefaults,
    mode: "onSubmit",
  });

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => portfolioApi.getPortfolioById(Number(id!)),
    enabled: !!id,
  });

  // پر کردن فرم با داده موجود
  useEffect(() => {
    if (portfolio) {
      form.reset({
        name: portfolio.title || "",
        slug: portfolio.slug || "",
        short_description: portfolio.short_description || "",
        description: portfolio.description || "",
        selectedCategories: portfolio.categories || [],
        selectedTags: portfolio.tags || [],
        selectedOptions: portfolio.options || [],
        featuredImage: portfolio.main_image || null,
        meta_title: portfolio.meta_title || "",
        meta_description: portfolio.meta_description || "",
        og_title: portfolio.og_title || "",
        og_description: portfolio.og_description || "",
        og_image: portfolio.og_image || null,
        canonical_url: portfolio.canonical_url || "",
        robots_meta: portfolio.robots_meta || "",
        is_public: portfolio.is_public ?? true,
        is_active: portfolio.is_active ?? true,
        is_featured: portfolio.is_featured ?? false,
        status: portfolio.status || "draft",
        extra_attributes: portfolio.extra_attributes || {},
      });

      if (portfolio.portfolio_media) {
        const parsedMedia = parsePortfolioMedia(portfolio.portfolio_media);
        setPortfolioMedia(parsedMedia);
      }
    }
  }, [portfolio, form]);

  const updatePortfolioMutation = useMutation({
    mutationFn: async (data: PortfolioFormValues & { status: "draft" | "published" }) => {
      if (!portfolio) throw new Error("Portfolio not found");

      const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(
        portfolioMedia,
        data.featuredImage
      );

      const uploadMax = env.PORTFOLIO_MEDIA_UPLOAD_MAX;
      const totalMedia = allMediaFiles.length + allMediaIds.length;
      if (totalMedia > uploadMax) {
        throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
      }

      const categoryIds = data.selectedCategories ? data.selectedCategories.map((cat: any) => typeof cat === 'number' ? cat : cat.id) : [];
      const tagIds = data.selectedTags ? data.selectedTags.map((tag: any) => typeof tag === 'number' ? tag : tag.id) : [];
      const optionIds = data.selectedOptions ? data.selectedOptions.map((option: any) => typeof option === 'number' ? option : option.id) : [];

      const existingMediaIds = collectMediaIds(portfolioMedia);
      const mainImageId = data.featuredImage?.id || portfolioMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(portfolioMedia);

      const updateData: PortfolioUpdateData = {
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
        extra_attributes: data.extra_attributes || {},
        categories_ids: categoryIds,
        tags_ids: tagIds,
        options_ids: optionIds,
        media_ids: allMediaIds.length > 0 ? allMediaIds : existingMediaIds,
        main_image_id: mainImageId,
        media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
      };

      if (allMediaFiles.length > 0) {
        await portfolioApi.updatePortfolio(portfolio.id, updateData);
        return await portfolioApi.addMediaToPortfolio(portfolio.id, allMediaFiles, allMediaIds);
      } else {
        return await portfolioApi.updatePortfolio(portfolio.id, updateData);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', id] });

      const successMessage = variables.status === "draft"
        ? msg.crud('saved', { item: 'پیش‌نویس نمونه‌کار' })
        : msg.crud('updated', { item: 'نمونه‌کار' });
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
            'options_ids': 'selectedOptions',
          };

          const formField = fieldMap[field] || field;
          form.setError(formField as keyof PortfolioFormValues, {
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
    updatePortfolioMutation.mutate({
      ...data,
      status: "published" as const
    });
  });

  const handleSaveDraft = form.handleSubmit(async (data) => {
    updatePortfolioMutation.mutate({
      ...data,
      status: "draft" as const
    });
  });

  if (isLoading) {
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
              <TabSkeleton />
            </>
          }
        />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">نمونه‌کار مورد نظر یافت نشد.</p>
      </div>
    );
  }

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
                  form={form}
                  editMode={editMode}
                  portfolioId={id}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="media">
              <Suspense fallback={<TabSkeleton />}>
                <MediaTab 
                  form={form}
                  portfolioMedia={portfolioMedia}
                  setPortfolioMedia={setPortfolioMedia}
                  editMode={editMode}
                  portfolioId={id}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="seo">
              <Suspense fallback={<TabSkeleton />}>
                <SEOTab 
                  form={form}
                  editMode={editMode}
                  portfolioId={id}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="extra">
              <Suspense fallback={<TabSkeleton />}>
                <ExtraAttributesTab 
                  form={form}
                  editMode={editMode}
                />
              </Suspense>
            </TabsContent>
          </>
        }
        saveBar={{
          onSave: handleSave,
          isSaving: updatePortfolioMutation.isPending || form.formState.isSubmitting,
          leftChildren: (
            <Button 
              onClick={handleSaveDraft} 
              variant="outline" 
              size="lg"
              disabled={updatePortfolioMutation.isPending || form.formState.isSubmitting}
            >
              {updatePortfolioMutation.isPending || form.formState.isSubmitting ? (
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
      />
    </div>
  );
}
