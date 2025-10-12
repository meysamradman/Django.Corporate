"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { 
  FileText, Edit2, Image, Search,
  Loader2, Save
} from "lucide-react";
import { Media } from "@/types/shared/media";
import { Portfolio } from "@/types/portfolio/portfolio";
import { portfolioApi } from "@/api/portfolios/route";

// Add this interface for managing multiple media selections
interface PortfolioMedia {
  featuredImage: Media | null;
  imageGallery: Media[];
  videoGallery: Media[];
  audioGallery: Media[];
  pdfDocuments: Media[];
}

const MediaTab = lazy(() => import("@/components/portfolios/list/create/MediaTab"));

export default function EditPortfolioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
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
      
      // Set media data if available
      if (portfolioData.portfolio_media) {
        const mediaData = portfolioData.portfolio_media;
        
        // Parse media data from portfolio
        const featuredImage = mediaData.find(m => m.is_main_image)?.media || null;
        const imageGallery = mediaData
          .filter(m => m.media.media_type === 'image' && !m.is_main_image)
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

  // Automatically generate slug from name (only if slug is empty)
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, formData.slug]);

  const handleInputChange = (field: string, value: string | Media | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!portfolio) return;
    
    setIsSaving(true);
    try {
      // Update portfolio
      const updatedPortfolio = await portfolioApi.updatePortfolio(portfolio.id, {
        title: formData.name,
        slug: formData.slug,
        short_description: formData.short_description,
        description: formData.description,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        og_title: formData.og_title || undefined,
        og_description: formData.og_description || undefined,
        og_image_id: formData.og_image?.id || undefined,
        canonical_url: formData.canonical_url || undefined,
        robots_meta: formData.robots_meta || undefined,
      });
      
      console.log("Portfolio updated:", updatedPortfolio);
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
      // Update portfolio as draft
      const updatedPortfolio = await portfolioApi.partialUpdatePortfolio(portfolio.id, {
        title: formData.name,
        slug: formData.slug,
        short_description: formData.short_description,
        description: formData.description,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        og_title: formData.og_title || undefined,
        og_description: formData.og_description || undefined,
        og_image_id: formData.og_image?.id || undefined,
        canonical_url: formData.canonical_url || undefined,
        robots_meta: formData.robots_meta || undefined,
      });
      
      console.log("Portfolio draft saved:", updatedPortfolio);
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
          <h1 className="text-2xl font-bold tracking-tight">ویرایش نمونه‌کار</h1>
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
              <Button onClick={handleSaveDraft} variant="outline" disabled={isSaving}>
                {isSaving ? (
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
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
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

        <div className="mt-6">
          {activeTab === "account" && (
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات پایه</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">نام</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">اسلاگ</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleInputChange("slug", e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">توضیحات کوتاه</label>
                    <textarea
                      value={formData.short_description}
                      onChange={(e) => handleInputChange("short_description", e.target.value)}
                      className="w-full p-2 border rounded"
                      rows={3}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">توضیحات کامل</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="w-full p-2 border rounded"
                      rows={6}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {activeTab === "media" && (
            <MediaTab 
              portfolioMedia={portfolioMedia}
              setPortfolioMedia={setPortfolioMedia}
              editMode={editMode}
            />
          )}
          {activeTab === "seo" && (
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات SEO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">عنوان متا (Meta Title)</label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => handleInputChange("meta_title", e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={!editMode}
                      placeholder="عنوان صفحه برای موتورهای جستجو"
                      maxLength={70}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      حداکثر 70 کاراکتر توصیه می‌شود
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">توضیحات متا (Meta Description)</label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => handleInputChange("meta_description", e.target.value)}
                      className="w-full p-2 border rounded"
                      rows={3}
                      disabled={!editMode}
                      placeholder="توضیحات صفحه برای موتورهای جستجو"
                      maxLength={300}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      بین 120 تا 160 کاراکتر توصیه می‌شود
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">عنوان Open Graph</label>
                    <input
                      type="text"
                      value={formData.og_title}
                      onChange={(e) => handleInputChange("og_title", e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={!editMode}
                      placeholder="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                      maxLength={70}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">توضیحات Open Graph</label>
                    <textarea
                      value={formData.og_description}
                      onChange={(e) => handleInputChange("og_description", e.target.value)}
                      className="w-full p-2 border rounded"
                      rows={3}
                      disabled={!editMode}
                      placeholder="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                      maxLength={300}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">تصویر Open Graph</label>
                    <div className="mt-1">
                      {formData.og_image ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={formData.og_image.url} 
                            alt="OG Image" 
                            className="w-16 h-16 object-cover rounded"
                          />
                          <span className="text-sm">{formData.og_image.id}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">تصویری انتخاب نشده است</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">آدرس کانونیکال (Canonical URL)</label>
                    <input
                      type="url"
                      value={formData.canonical_url}
                      onChange={(e) => handleInputChange("canonical_url", e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={!editMode}
                      placeholder="https://example.com/portfolio/item"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">دستورالعمل ربات‌های جستجو (Robots Meta)</label>
                    <input
                      type="text"
                      value={formData.robots_meta}
                      onChange={(e) => handleInputChange("robots_meta", e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={!editMode}
                      placeholder="index,follow"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Tabs>
    </div>
  );
}