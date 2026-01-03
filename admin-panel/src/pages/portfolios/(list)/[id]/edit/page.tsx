import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { 
  FileText, Image, Search,
  Loader2, Save, Settings
} from "lucide-react";
import type { Media } from "@/types/shared/media";
import type { Portfolio } from "@/types/portfolio/portfolio";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { showError } from '@/core/toast';
import type { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { collectMediaIds, collectMediaCovers, parsePortfolioMedia } from "@/components/portfolios/utils/portfolioMediaUtils";
import type { PortfolioUpdateData } from "@/types/portfolio/portfolio";
import AdminTabsFormWrapper from "@/components/elements/AdminTabsFormWrapper";

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

const BaseInfoTab = lazy(() => import("@/components/portfolios/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/portfolios/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/portfolios/list/create/SEOTab"));
const ExtraAttributesTab = lazy(() => import("@/components/portfolios/list/create/ExtraAttributesTab"));

export default function EditPortfolioPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, _setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioMedia, setPortfolioMedia] = useState<PortfolioMedia>({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
  });
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    short_description: "",
    description: "",
    meta_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    og_image: null as Media | null,
    canonical_url: "",
    robots_meta: "",
    extra_attributes: {} as Record<string, any>,
    is_public: true,
    is_active: true,
    is_featured: false,
    status: "draft" as "draft" | "published",
  });
  
  const [selectedCategories, setSelectedCategories] = useState<PortfolioCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<PortfolioTag[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<PortfolioOption[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    if (id) {
      fetchPortfolioData();
    }
  }, [id]);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      const portfolioData = await portfolioApi.getPortfolioById(Number(id));
      setPortfolio(portfolioData);
      
      setFormData({
        name: portfolioData.title || "",
        slug: portfolioData.slug || "",
        short_description: portfolioData.short_description || "",
        description: portfolioData.description || "",
        meta_title: portfolioData.meta_title || "",
        meta_description: portfolioData.meta_description || "",
        og_title: portfolioData.og_title || "",
        og_description: portfolioData.og_description || "",
        og_image: portfolioData.og_image || null,
        canonical_url: portfolioData.canonical_url || "",
        robots_meta: portfolioData.robots_meta || "",
        extra_attributes: portfolioData.extra_attributes || {},
        is_public: portfolioData.is_public ?? true,
        is_active: portfolioData.is_active ?? true,
        is_featured: portfolioData.is_featured ?? false,
        status: portfolioData.status || "draft",
      });
      
      if (portfolioData.categories) {
        setSelectedCategories(portfolioData.categories);
      }
      
      if (portfolioData.tags) {
        setSelectedTags(portfolioData.tags);
      }
      
      if (portfolioData.options) {
        setSelectedOptions(portfolioData.options);
      }
      
      if (portfolioData.portfolio_media) {
        const parsedMedia = parsePortfolioMedia(portfolioData.portfolio_media);
        setPortfolioMedia(parsedMedia);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Media | boolean | null) => {
    if (field === "name" && typeof value === "string") {
      const generatedSlug = generateSlug(value);
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        slug: generatedSlug
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCategoryToggle = (category: PortfolioCategory) => {
    setSelectedCategories(prev => {
      if (prev.some(c => c.id === category.id)) {
        return prev.filter(c => c.id !== category.id);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleCategoryRemove = (categoryId: number) => {
    setSelectedCategories(prev => prev.filter(category => category.id !== categoryId));
  };

  const handleTagToggle = (tag: PortfolioTag) => {
    setSelectedTags(prev => {
      if (prev.some(t => t.id === tag.id)) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleTagRemove = (tagId: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const handleOptionToggle = (option: PortfolioOption) => {
    setSelectedOptions(prev => {
      if (prev.some(o => o.id === option.id)) {
        return prev.filter(o => o.id !== option.id);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleOptionRemove = (optionId: number) => {
    setSelectedOptions(prev => prev.filter(option => option.id !== optionId));
  };

  const handleFeaturedImageChange = (media: Media | null) => {
    setPortfolioMedia(prev => ({
      ...prev,
      featuredImage: media
    }));
  };

  const handleSave = async () => {
    if (!portfolio) return;
    
    setIsSaving(true);
    try {
      const slugValidation = validateSlug(formData.slug, true);
      if (!slugValidation.isValid) {
        showError(new Error(slugValidation.error || "اسلاگ معتبر نیست"));
        setIsSaving(false);
        return;
      }
      
      let formattedSlug = formatSlug(formData.slug);
      
      const categoryIds = selectedCategories.map(category => category.id);
      const tagIds = selectedTags.map(tag => tag.id);
      const optionIds = selectedOptions.map(option => option.id);
      
      const allMediaIds = collectMediaIds(portfolioMedia);
      const mainImageId = portfolioMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(portfolioMedia);
      
      const updateData: PortfolioUpdateData = {
        title: formData.name,
        slug: formattedSlug,
        short_description: formData.short_description,
        description: formData.description,
        categories_ids: categoryIds,
        tags_ids: tagIds,
        options_ids: optionIds,
        media_ids: allMediaIds,
        main_image_id: mainImageId,
        media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        og_title: formData.og_title || undefined,
        og_description: formData.og_description || undefined,
        og_image_id: formData.og_image?.id || undefined,
        canonical_url: formData.canonical_url || undefined,
        robots_meta: formData.robots_meta || undefined,
        extra_attributes: formData.extra_attributes || {},
        status: formData.status || "published",
        is_public: formData.is_public,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };
      
      await portfolioApi.updatePortfolio(portfolio.id, updateData);
      
      navigate("/portfolios");
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!portfolio) return;
    
    setIsSaving(true);
    try {
      const slugValidation = validateSlug(formData.slug, true);
      if (!slugValidation.isValid) {
        showError(new Error(slugValidation.error || "اسلاگ معتبر نیست"));
        setIsSaving(false);
        return;
      }
      
      let formattedSlug = formatSlug(formData.slug);
      
      const categoryIds = selectedCategories.map(category => category.id);
      const tagIds = selectedTags.map(tag => tag.id);
      const optionIds = selectedOptions.map(option => option.id);
      
      const allMediaIds = collectMediaIds(portfolioMedia);
      const mainImageId = portfolioMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(portfolioMedia);
      
      const updateData: PortfolioUpdateData = {
        title: formData.name,
        slug: formattedSlug,
        short_description: formData.short_description,
        description: formData.description,
        categories_ids: categoryIds,
        tags_ids: tagIds,
        options_ids: optionIds,
        media_ids: allMediaIds,
        main_image_id: mainImageId,
        media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        og_title: formData.og_title || undefined,
        og_description: formData.og_description || undefined,
        og_image_id: formData.og_image?.id || undefined,
        canonical_url: formData.canonical_url || undefined,
        robots_meta: formData.robots_meta || undefined,
        extra_attributes: formData.extra_attributes || {},
        status: "draft",
        is_public: formData.is_public,
        is_active: formData.is_active,
      };
      
      await portfolioApi.partialUpdatePortfolio(portfolio.id, updateData);
      
      navigate("/portfolios");
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

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
          <TabSkeleton />
        </Tabs>
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
                  formData={formData}
                  handleInputChange={handleInputChange}
                  editMode={editMode}
                  selectedCategories={selectedCategories}
                  selectedTags={selectedTags}
                  selectedOptions={selectedOptions}
                  onCategoryToggle={handleCategoryToggle}
                  onCategoryRemove={handleCategoryRemove}
                  onTagToggle={handleTagToggle}
                  onTagRemove={handleTagRemove}
                  onOptionToggle={handleOptionToggle}
                  onOptionRemove={handleOptionRemove}
                  portfolioId={id}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="media">
              <Suspense fallback={<TabSkeleton />}>
                <MediaTab 
                  portfolioMedia={portfolioMedia}
                  setPortfolioMedia={setPortfolioMedia}
                  editMode={editMode}
                  featuredImage={portfolioMedia.featuredImage}
                  onFeaturedImageChange={handleFeaturedImageChange}
                  portfolioId={id}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="seo">
              <Suspense fallback={<TabSkeleton />}>
                <SEOTab 
                  formData={formData}
                  handleInputChange={handleInputChange}
                  editMode={editMode}
                  portfolioId={id}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="extra">
              <Suspense fallback={<TabSkeleton />}>
                <ExtraAttributesTab 
                  formData={formData}
                  handleInputChange={handleInputChange}
                  editMode={editMode}
                />
              </Suspense>
            </TabsContent>
          </>
        }
        saveBar={{
          onSave: handleSave,
          isSaving,
          leftChildren: (
            <Button 
              onClick={handleSaveDraft} 
              variant="outline" 
              size="lg"
              disabled={isSaving}
            >
              {isSaving ? (
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
