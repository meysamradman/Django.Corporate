"use client";

import { use, useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { 
  FileText, Edit2, Image, Search,
  Loader2, Save, List
} from "lucide-react";
import { Media } from "@/types/shared/media";
import { Blog } from "@/types/blog/blog";
import { BlogTag } from "@/types/blog/tags/blogTag";
import { BlogCategory } from "@/types/blog/category/blogCategory";
import { blogApi } from "@/api/blogs/route";
import { generateSlug } from '@/core/utils/slugUtils';
import { BlogMedia } from "@/types/blog/blogMedia";
import { collectMediaIds, collectMediaCovers, parseBlogMedia } from "@/core/utils/blogMediaUtils";

// Extend Blog interface to include category and tag IDs for API calls
interface BlogUpdateData extends Partial<Blog> {
  categories_ids?: number[];
  tags_ids?: number[];
  media_ids?: number[];
  main_image_id?: number | null;
  media_covers?: { [mediaId: number]: number | null };
}

const BaseInfoTab = lazy(() => import("@/components/blogs/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/blogs/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/blogs/list/create/SEOTab"));

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, setEditMode] = useState(true);
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
  
  // Category and tag state for edit page
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
      
      // Set form data
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
      
      // Set categories if available
      if (blogData.categories) {
        setSelectedCategories(blogData.categories);
      }
      
      // Set tags if available
      if (blogData.tags) {
        setSelectedTags(blogData.tags);
      }
      
      // Set media data if available
      if (blogData.blog_media) {
        const parsedMedia = parseBlogMedia(blogData.blog_media);
        setBlogMedia(parsedMedia);
      }
    } catch (error) {
      // Error fetching blog data
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
      
      // Collect all media IDs and covers using utility functions
      const allMediaIds = collectMediaIds(blogMedia);
      const mainImageId = blogMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(blogMedia);
      
      // Prepare update data with extended interface
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
      
      // Update blog (includes media sync with cover images)
      const updatedBlog = await blogApi.updateBlog(blog.id, updateData);
      
      // Redirect to blog list after saving
      router.push("/blogs");
    } catch (error) {
      // Error updating blog
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!blog) return;
    
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
      
      // Collect all media IDs and covers using utility functions
      const allMediaIds = collectMediaIds(blogMedia);
      const mainImageId = blogMedia.featuredImage?.id || null;
      const mediaCovers = collectMediaCovers(blogMedia);
      
      // Prepare update data with extended interface
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
      
      // Update blog as draft (includes media sync with cover images)
      const updatedBlog = await blogApi.partialUpdateBlog(blog.id, updateData);
      
      // Redirect to blog list after saving draft
      router.push("/blogs");
    } catch (error) {
      // Error saving blog draft
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

  if (!blog) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">ویرایش وبلاگ</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive">وبلاگ مورد نظر یافت نشد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ویرایش وبلاگ</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push("/blogs")}
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
              onCategoryToggle={handleCategoryToggle}
              onCategoryRemove={handleCategoryRemove}
              onTagToggle={handleTagToggle}
              onTagRemove={handleTagRemove}
              blogId={id}
            />
          )}
          {activeTab === "media" && (
            <MediaTab 
              blogMedia={blogMedia}
              setBlogMedia={setBlogMedia}
              editMode={editMode}
              featuredImage={blogMedia.featuredImage}
              onFeaturedImageChange={handleFeaturedImageChange}
              blogId={id}
            />
          )}
          {activeTab === "seo" && (
            <SEOTab 
              formData={formData}
              handleInputChange={handleInputChange}
              editMode={editMode}
              blogId={id}
            />
          )}
        </Suspense>
      </Tabs>

      {/* Sticky Save Buttons Footer */}
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
