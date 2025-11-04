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
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { portfolioApi } from "@/api/portfolios/route";
import { generateSlug } from '@/core/utils/slugUtils';

// Extend Portfolio interface to include category and tag IDs for API calls
interface PortfolioUpdateData extends Partial<Portfolio> {
  categories_ids?: number[];
  tags_ids?: number[];
  options_ids?: number[];
}

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
  });
  
  // Category and tag state for edit page
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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
      });
      
      // Set category if available
      if (portfolioData.categories && portfolioData.categories.length > 0) {
        setSelectedCategory(String(portfolioData.categories[0].id));
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
        const mediaData = portfolioData.portfolio_media;
        
        // Parse media data from portfolio
        // Type guard to check if media item is an image with is_main_image property
        const featuredImage = mediaData.find(m => 
          'is_main_image' in m && m.is_main_image
        )?.media || null;
        
        const imageGallery = mediaData
          .filter(m => 
            m.media.media_type === 'image' && 
            !('is_main_image' in m && m.is_main_image)
          )
          .map(m => m.media);
        
        const videoGallery = mediaData
          .filter(m => m.media.media_type === 'video')
          .map(m => m.media);
        
        const audioGallery = mediaData
          .filter(m => m.media.media_type === 'audio')
          .map(m => m.media);
        
        const pdfDocuments = mediaData
          .filter(m => m.media.media_type === 'pdf')
          .map(m => m.media);
        
        setPortfolioMedia({
          featuredImage,
          imageGallery,
          videoGallery,
          audioGallery,
          pdfDocuments
        });
      }
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Media | null) => {
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

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
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
      const categoryIds = selectedCategory ? [parseInt(selectedCategory)] : [];
      const tagIds = selectedTags.map(tag => tag.id);
      const optionIds = selectedOptions.map(option => option.id);
      
      // Prepare update data with extended interface
      const updateData: PortfolioUpdateData = {
        title: formData.name,
        slug: formattedSlug,
        short_description: formData.short_description,
        description: formData.description,
        categories_ids: categoryIds, // Use the correct field name expected by the backend
        tags_ids: tagIds, // Use the correct field name expected by the backend
        options_ids: optionIds, // Use the correct field name expected by the backend
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        og_title: formData.og_title || undefined,
        og_description: formData.og_description || undefined,
        og_image_id: formData.og_image?.id || undefined,
        canonical_url: formData.canonical_url || undefined,
        robots_meta: formData.robots_meta || undefined,
      };
      
      // Update portfolio
      const updatedPortfolio = await portfolioApi.updatePortfolio(portfolio.id, updateData);
      
      // Redirect to portfolio list after saving
      router.push("/portfolios");
    } catch (error) {
      console.error("Error updating portfolio:", error);
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
      const categoryIds = selectedCategory ? [parseInt(selectedCategory)] : [];
      const tagIds = selectedTags.map(tag => tag.id);
      const optionIds = selectedOptions.map(option => option.id);
      
      // Prepare update data with extended interface
      const updateData: PortfolioUpdateData = {
        title: formData.name,
        slug: formattedSlug,
        short_description: formData.short_description,
        description: formData.description,
        categories_ids: categoryIds, // Use the correct field name expected by the backend
        tags_ids: tagIds, // Use the correct field name expected by the backend
        options_ids: optionIds, // Use the correct field name expected by the backend
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        og_title: formData.og_title || undefined,
        og_description: formData.og_description || undefined,
        og_image_id: formData.og_image?.id || undefined,
        canonical_url: formData.canonical_url || undefined,
        robots_meta: formData.robots_meta || undefined,
      };
      
      // Update portfolio as draft
      const updatedPortfolio = await portfolioApi.partialUpdatePortfolio(portfolio.id, updateData);
      
      // Redirect to portfolio list after saving draft
      router.push("/portfolios");
    } catch (error) {
      console.error("Error saving portfolio draft:", error);
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
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
              selectedCategory={selectedCategory}
              selectedTags={selectedTags}
              selectedOptions={selectedOptions}
              onCategoryChange={handleCategoryChange}
              onTagToggle={handleTagToggle}
              onTagRemove={handleTagRemove}
              onOptionToggle={handleOptionToggle}
              onOptionRemove={handleOptionRemove}
            />
          )}
          {activeTab === "media" && (
            <MediaTab 
              portfolioMedia={portfolioMedia}
              setPortfolioMedia={setPortfolioMedia}
              editMode={editMode}
              featuredImage={portfolioMedia.featuredImage}
              onFeaturedImageChange={handleFeaturedImageChange}
            />
          )}
          {activeTab === "seo" && (
            <SEOTab 
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
            />
          )}
        </Suspense>
      </Tabs>
    </div>
  );
}
