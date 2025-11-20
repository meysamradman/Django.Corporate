"use client";

import { use, useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { 
  FileText, Edit2, Image, Search,
  Loader2, Save
} from "lucide-react";
import { Media } from "@/types/shared/media";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { portfolioApi } from "@/api/portfolios/route";
import { generateSlug } from '@/core/utils/slugUtils';
import { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { collectMediaIds, collectMediaCovers, parsePortfolioMedia } from "@/core/utils/portfolioMediaUtils";

// Extend Portfolio interface to include category and tag IDs for API calls
interface PortfolioUpdateData extends Partial<Portfolio> {
  categories_ids?: number[];
  tags_ids?: number[];
  options_ids?: number[];
  media_ids?: number[];
  main_image_id?: number | null;
  media_covers?: { [mediaId: number]: number | null };
}

const BaseInfoTab = lazy(() => import("@/components/portfolios/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/portfolios/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/portfolios/list/create/SEOTab"));

export default function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, setEditMode] = useState(true);
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
    is_public: true,
    is_active: true,
  });
  
  // Category and tag state for edit page
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
      
      // Set form data
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
        is_public: portfolioData.is_public ?? true,
        is_active: portfolioData.is_active ?? true,
      });
      
      // Set categories if available
      if (portfolioData.categories) {
        setSelectedCategories(portfolioData.categories);
      }
      
      // Set tags if available
      if (portfolioData.tags) {
        setSelectedTags(portfolioData.tags);
      }
      
      // Set options if available
      if (portfolioData.options) {
        setSelectedOptions(portfolioData.options);
      }
      
      // Set media data if available
      if (portfolioData.portfolio_media) {
        const parsedMedia = parsePortfolioMedia(portfolioData.portfolio_media);
        setPortfolioMedia(parsedMedia);
      }
    } catch (error) {
      // Error fetching portfolio data
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Media | boolean | null) => {
    // If we're updating the name field, always generate/update slug
    if (field === "name" && typeof value === "string") {
      const generatedSlug = generateSlug(value);
      
      // Update both name and slug
      setFormData(prev => ({
        ...prev,
        [field]: value,
        slug: generatedSlug
      }));
    } else {
      // Update only the specified field
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
    // Toggle tag selection
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
      // Ensure the slug is properly formatted before sending to backend
      let formattedSlug = formData.slug;
      if (formattedSlug) {
        formattedSlug = formattedSlug
          .replace(/^-+|-+$/g, '') // Trim - from start and end
          .substring(0, 60); // Ensure it doesn't exceed max length
      }
      
      // Prepare category and tag IDs for the backend
      const categoryIds = selectedCategories.map(category => category.id);
      const tagIds = selectedTags.map(tag => tag.id);
      const optionIds = selectedOptions.map(option => option.id);
      
      // Collect all media IDs and covers using utility functions
      const allMediaIds = collectMediaIds(portfolioMedia);
      const mainImageId = portfolioMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(portfolioMedia);
      
      // Prepare update data with extended interface
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
        status: "published",
        is_public: formData.is_public,
        is_active: formData.is_active,
      };
      
      // Update portfolio (includes media sync with cover images)
      const updatedPortfolio = await portfolioApi.updatePortfolio(portfolio.id, updateData);
      
      // Redirect to portfolio list after saving
      router.push("/portfolios");
    } catch (error) {
      // Error updating portfolio
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!portfolio) return;
    
    setIsSaving(true);
    try {
      // Ensure the slug is properly formatted before sending to backend
      let formattedSlug = formData.slug;
      if (formattedSlug) {
        formattedSlug = formattedSlug
          .replace(/^-+|-+$/g, '') // Trim - from start and end
          .substring(0, 60); // Ensure it doesn't exceed max length
      }
      
      // Prepare category and tag IDs for the backend
      const categoryIds = selectedCategories.map(category => category.id);
      const tagIds = selectedTags.map(tag => tag.id);
      const optionIds = selectedOptions.map(option => option.id);
      
      // Collect all media IDs and covers using utility functions
      const allMediaIds = collectMediaIds(portfolioMedia);
      const mainImageId = portfolioMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(portfolioMedia);
      
      // Prepare update data with extended interface
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
        status: "draft",
        is_public: formData.is_public,
        is_active: formData.is_active,
      };
      
      // Update portfolio as draft (includes media sync with cover images)
      const updatedPortfolio = await portfolioApi.partialUpdatePortfolio(portfolio.id, updateData);
      
      // Redirect to portfolio list after saving draft
      router.push("/portfolios");
    } catch (error) {
      // Error saving portfolio draft
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">ویرایش نمونه‌کار</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive">نمونه‌کار مورد نظر یافت نشد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ویرایش نمونه‌کار</h1>
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
              <Button onClick={handleSaveDraft} variant="outline" disabled={isSaving}>
                {isSaving ? (
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
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
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

        <Suspense fallback={
          <div className="mt-6">
            <Skeleton className="w-full h-64" />
            <Skeleton className="w-full h-64 mt-4" />
          </div>
        }>
          {activeTab === "account" && (
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
          )}
          {activeTab === "media" && (
            <MediaTab 
              portfolioMedia={portfolioMedia}
              setPortfolioMedia={setPortfolioMedia}
              editMode={editMode}
              featuredImage={portfolioMedia.featuredImage}
              onFeaturedImageChange={handleFeaturedImageChange}
              portfolioId={id}
            />
          )}
          {activeTab === "seo" && (
            <SEOTab 
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
              portfolioId={id}
            />
          )}
        </Suspense>
      </Tabs>
    </div>
  );
}
