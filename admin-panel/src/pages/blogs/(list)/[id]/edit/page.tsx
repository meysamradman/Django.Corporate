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
import type { Blog } from "@/types/blog/blog";
import type { BlogTag } from "@/types/blog/tags/blogTag";
import type { BlogCategory } from "@/types/blog/category/blogCategory";
import { blogApi } from "@/api/blogs/blogs";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { showError } from '@/core/toast';
import type { BlogMedia } from "@/types/blog/blogMedia";
import { collectMediaIds, collectMediaCovers, parseBlogMedia } from "@/components/blogs/utils/blogMediaUtils";
import type { BlogUpdateData } from "@/types/blog/blog";

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

const BaseInfoTab = lazy(() => import("@/components/blogs/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/blogs/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/blogs/list/create/SEOTab"));

export default function EditBlogPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, _setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [blogMedia, setBlogMedia] = useState<BlogMedia>({
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
  
  const [selectedCategories, setSelectedCategories] = useState<BlogCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<BlogTag[]>([]);
  const [blog, setBlog] = useState<Blog | null>(null);

  useEffect(() => {
    if (id) {
      fetchBlogData();
    }
  }, [id]);

  const fetchBlogData = async () => {
    try {
      setIsLoading(true);
      const blogData = await blogApi.getBlogById(Number(id));
      setBlog(blogData);
      
      setFormData({
        name: blogData.title || "",
        slug: blogData.slug || "",
        short_description: blogData.short_description || "",
        description: blogData.description || "",
        meta_title: blogData.meta_title || "",
        meta_description: blogData.meta_description || "",
        og_title: blogData.og_title || "",
        og_description: blogData.og_description || "",
        og_image: blogData.og_image || null,
        canonical_url: blogData.canonical_url || "",
        robots_meta: blogData.robots_meta || "",
        is_public: blogData.is_public ?? true,
        is_active: blogData.is_active ?? true,
      });
      
      if (blogData.categories) {
        setSelectedCategories(blogData.categories);
      }
      
      if (blogData.tags) {
        setSelectedTags(blogData.tags);
      }
      
      if (blogData.blog_media) {
        const parsedMedia = parseBlogMedia(blogData.blog_media);
        setBlogMedia(parsedMedia);
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

  const handleCategoryToggle = (category: BlogCategory) => {
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

  const handleTagToggle = (tag: BlogTag) => {
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

  const handleFeaturedImageChange = (media: Media | null) => {
    setBlogMedia(prev => ({
      ...prev,
      featuredImage: media
    }));
  };

  const handleSave = async () => {
    if (!blog) return;
    
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
      
      const allMediaIds = collectMediaIds(blogMedia);
      const mainImageId = blogMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(blogMedia);
      
      const updateData: BlogUpdateData = {
        title: formData.name,
        slug: formattedSlug,
        short_description: formData.short_description,
        description: formData.description,
        categories_ids: categoryIds,
        tags_ids: tagIds,
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
      
      await blogApi.updateBlog(blog.id, updateData);
      
      navigate("/blogs");
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!blog) return;
    
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
      
      const allMediaIds = collectMediaIds(blogMedia);
      const mainImageId = blogMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(blogMedia);
      
      const updateData: BlogUpdateData = {
        title: formData.name,
        slug: formattedSlug,
        short_description: formData.short_description,
        description: formData.description,
        categories_ids: categoryIds,
        tags_ids: tagIds,
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
      
      await blogApi.partialUpdateBlog(blog.id, updateData);
      
      navigate("/blogs");
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

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="space-y-6">
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
        </Tabs>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">وبلاگ مورد نظر یافت نشد.</p>
      </div>
    );
  }

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

        <TabsContent value="account">
          <Suspense fallback={<TabSkeleton />}>
            <BaseInfoTab 
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
              selectedCategories={selectedCategories}
              selectedTags={selectedTags}
              onCategoryToggle={handleCategoryToggle}
              onCategoryRemove={handleCategoryRemove}
              onTagToggle={handleTagToggle}
              onTagRemove={handleTagRemove}
              blogId={id}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="media">
          <Suspense fallback={<TabSkeleton />}>
            <MediaTab 
              blogMedia={blogMedia}
              setBlogMedia={setBlogMedia}
              editMode={editMode}
              featuredImage={blogMedia.featuredImage}
              onFeaturedImageChange={handleFeaturedImageChange}
              blogId={id}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="seo">
          <Suspense fallback={<TabSkeleton />}>
            <SEOTab 
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
            blogId={id}
          />
          </Suspense>
        </TabsContent>
      </Tabs>

      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
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
          <Button 
            onClick={handleSave} 
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
                ذخیره
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
