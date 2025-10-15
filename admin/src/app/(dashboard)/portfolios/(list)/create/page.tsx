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
import slugify from "slugify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { fetchApi } from "@/core/config/fetch";

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

  // Automatically generate slug from name
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const generatedSlug = slugify(formData.name, { 
        lower: true, 
        strict: true,
        locale: 'en' // Use English locale for consistency
      });
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, formData.slug]);

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the portfolio
      const portfolio = await portfolioApi.createPortfolio(data);
      
      // Then add media files if we have any
      const allMediaFiles: File[] = [];
      
      // Collect all media files from portfolioMedia
      if (portfolioMedia.featuredImage && (portfolioMedia.featuredImage as any).file instanceof File) {
        allMediaFiles.push((portfolioMedia.featuredImage as any).file);
      }
      
      portfolioMedia.imageGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          allMediaFiles.push((media as any).file);
        }
      });
      
      portfolioMedia.videoGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          allMediaFiles.push((media as any).file);
        }
      });
      
      portfolioMedia.audioGallery.forEach(media => {
        if ((media as any).file instanceof File) {
          allMediaFiles.push((media as any).file);
        }
      });
      
      portfolioMedia.pdfDocuments.forEach(media => {
        if ((media as any).file instanceof File) {
          allMediaFiles.push((media as any).file);
        }
      });
      
      // If we have media files, upload them
      if (allMediaFiles.length > 0) {
        try {
          await portfolioApi.addMediaToPortfolio(portfolio.id, allMediaFiles);
        } catch (error) {
          console.error("Error uploading media:", error);
          // Don't fail the whole operation if media upload fails
        }
      }
      
      return portfolio;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      router.push("/portfolios");
    },
    onError: (error) => {
      console.error("Error creating portfolio:", error);
    },
  });

  const handleInputChange = (field: string, value: string | Media | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    const portfolioData = {
      title: formData.name,
      slug: formData.slug,
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
    };
    
    createPortfolioMutation.mutate(portfolioData);
  };

  const handleSaveDraft = async () => {
    const portfolioData = {
      title: formData.name,
      slug: formData.slug,
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
    };
    
    createPortfolioMutation.mutate(portfolioData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ایجاد نمونه‌کار جدید</h1>
          <p className="text-muted-foreground">مدیریت اطلاعات نمونه‌کار</p>
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