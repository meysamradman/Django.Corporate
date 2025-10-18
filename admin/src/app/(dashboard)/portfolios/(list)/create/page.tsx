"use client";

import { useState, lazy, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { 
  FileText, Edit2, Image, 
  Loader2, Save, Search
} from "lucide-react";
import { Media } from "@/types/shared/media";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { fetchApi } from "@/core/config/fetch";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { generateSlug } from '@/core/utils/slugUtils';

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
  const [isSaving, setIsSaving] = useState(false);
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
  
  // Category and tag state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<PortfolioTag[]>([]);

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the portfolio with categories and tags
      const portfolio = await portfolioApi.createPortfolio(data);
      
      // Prepare media data for upload
      const allMediaFiles: File[] = [];
      const allMediaIds: number[] = [];
      
      // Collect media files and IDs
      // Featured Image
      if (portfolioMedia.featuredImage) {
        if ((portfolioMedia.featuredImage as any).file instanceof File) {
          // New file to upload
          allMediaFiles.push((portfolioMedia.featuredImage as any).file);
        } else if (portfolioMedia.featuredImage.id) {
          // Existing media from library
          allMediaIds.push(portfolioMedia.featuredImage.id);
        }
      }
      
      // Image Gallery
      portfolioMedia.imageGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          // New file to upload
          allMediaFiles.push((media as any).file);
        } else if (media.id) {
          // Existing media from library
          allMediaIds.push(media.id);
        }
      });
      
      // Video Gallery
      portfolioMedia.videoGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          // New file to upload
          allMediaFiles.push((media as any).file);
        } else if (media.id) {
          // Existing media from library
          allMediaIds.push(media.id);
        }
      });
      
      // Audio Gallery
      portfolioMedia.audioGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          // New file to upload
          allMediaFiles.push((media as any).file);
        } else if (media.id) {
          // Existing media from library
          allMediaIds.push(media.id);
        }
      });
      
      // PDF Documents
      portfolioMedia.pdfDocuments.forEach(media => {
        if ((media as any).file instanceof File) {
          // New file to upload
          allMediaFiles.push((media as any).file);
        } else if (media.id) {
          // Existing media from library
          allMediaIds.push(media.id);
        }
      });
      
      // Upload media if we have any files or existing media IDs
      if (allMediaFiles.length > 0 || allMediaIds.length > 0) {
        try {
          const mediaResponse = await portfolioApi.addMediaToPortfolio(portfolio.id, allMediaFiles, allMediaIds);
        } catch (error) {
          // Don't fail the whole operation if media processing fails
        }
      }
      
      return portfolio;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      router.push("/portfolios");
    },
    onError: (error: any) => {
      console.error("Error creating portfolio:", error);
      if (error.validationErrors) {
        console.error("Validation errors:", error.validationErrors);
      }
    },
  });

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

  const handleSave = async () => {
    // Ensure the slug is properly formatted before sending to backend
    let formattedSlug = formData.slug;
    if (formattedSlug) {
      formattedSlug = formattedSlug
        .replace(/^-+|-+$/g, '') // Trim - from start and end
        .substring(0, 60); // Ensure it doesn't exceed max length
    }
    
    // Prepare categories and tags data
    const categoriesIds = selectedCategory ? [parseInt(selectedCategory)] : [];
    const tagsIds = selectedTags.map(tag => tag.id);
    
    const portfolioData = {
      title: formData.name,
      slug: formattedSlug,
      short_description: formData.short_description,
      description: formData.description,
      status: "published",
      is_featured: false,
      is_public: true,
      meta_title: formData.meta_title || undefined,
      meta_description: formData.meta_description || undefined,
      og_title: formData.og_title || undefined,
      og_description: formData.og_description || undefined,
      og_image_id: formData.og_image?.id || undefined,
      canonical_url: formData.canonical_url || undefined,
      robots_meta: formData.robots_meta || undefined,
      categories_ids: categoriesIds,
      tags_ids: tagsIds,
    };
    
    createPortfolioMutation.mutate(portfolioData);
  };

  const handleSaveDraft = async () => {
    // Ensure the slug is properly formatted before sending to backend
    let formattedSlug = formData.slug;
    if (formattedSlug) {
      formattedSlug = formattedSlug
        .replace(/^-+|-+$/g, '') // Trim - from start and end
        .substring(0, 60); // Ensure it doesn't exceed max length
    }
    
    // Prepare categories and tags data
    const categoriesIds = selectedCategory ? [parseInt(selectedCategory)] : [];
    const tagsIds = selectedTags.map(tag => tag.id);
    
    const portfolioData = {
      title: formData.name,
      slug: formattedSlug,
      short_description: formData.short_description,
      description: formData.description,
      status: "draft",
      is_featured: false,
      is_public: true,
      meta_title: formData.meta_title || undefined,
      meta_description: formData.meta_description || undefined,
      og_title: formData.og_title || undefined,
      og_description: formData.og_description || undefined,
      og_image_id: formData.og_image?.id || undefined,
      canonical_url: formData.canonical_url || undefined,
      robots_meta: formData.robots_meta || undefined,
      categories_ids: categoriesIds,
      tags_ids: tagsIds,
    };
    
    createPortfolioMutation.mutate(portfolioData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ایجاد نمونه‌کار جدید</h1>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 className="w-4 h-4 me-2" />
              ویرایش
            </Button>
          )}
          {editMode && (
            <>
              <Button onClick={handleSaveDraft} variant="outline" disabled={createPortfolioMutation.isPending}>
                {createPortfolioMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 me-2" />
                    ذخیره پیش‌نویس
                  </>
                )}
              </Button>
              <Button onClick={handleSave} disabled={createPortfolioMutation.isPending}>
                {createPortfolioMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 me-2" />
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
            <FileText className="w-4 h-4 me-2" />
            اطلاعات پایه
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="w-4 h-4 me-2" />
            مدیا
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="w-4 h-4 me-2" />
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
              onCategoryChange={handleCategoryChange}
              onTagToggle={handleTagToggle}
              onTagRemove={handleTagRemove}
            />
          )}
          {activeTab === "media" && (
            <MediaTab 
              portfolioMedia={portfolioMedia}
              setPortfolioMedia={setPortfolioMedia}
              editMode={editMode}
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
