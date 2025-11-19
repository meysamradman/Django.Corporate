"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton, useUIPermissions } from '@/core/permissions';
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { pageApi } from "@/api/page/route";
import { AboutPage } from "@/types/page/page";
import { toast } from "@/components/elements/Sonner";
import { Media } from "@/types/shared/media";
import { Save, Loader2, FileText, Search } from "lucide-react";
import { BaseInfoTab } from "./tabs/BaseInfoTab";
import { SEOTab } from "./tabs/SEOTab";
import { Skeleton } from "@/components/elements/Skeleton";

export function AboutPageForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("base");
    const [page, setPage] = useState<AboutPage | null>(null);
    
    // 🚀 Pre-computed permission flag
    const { canManagePages } = useUIPermissions();
    
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [ogTitle, setOgTitle] = useState("");
    const [ogDescription, setOgDescription] = useState("");
    const [canonicalUrl, setCanonicalUrl] = useState("");
    const [robotsMeta, setRobotsMeta] = useState("index,follow");
    
    const [featuredImage, setFeaturedImage] = useState<Media | null>(null);
    const [ogImage, setOgImage] = useState<Media | null>(null);

    useEffect(() => {
        fetchPage();
    }, []);

    const fetchPage = async () => {
        try {
            setLoading(true);
            const data = await pageApi.getAboutPage();
            setPage(data);
            
            setTitle(data.title || "");
            setContent(data.content || "");
            setShortDescription(data.short_description || "");
            
            setMetaTitle(data.meta_title || "");
            setMetaDescription(data.meta_description || "");
            setOgTitle(data.og_title || "");
            setOgDescription(data.og_description || "");
            setCanonicalUrl(data.canonical_url || "");
            setRobotsMeta(data.robots_meta || "index,follow");
            
            if (data.featured_image_data) {
                setFeaturedImage(data.featured_image_data);
            }
            if (data.og_image_data) {
                setOgImage(data.og_image_data);
            }
        } catch (error: any) {
            const errorMessage = error?.message || error?.response?.message || "خطا در دریافت صفحه درباره ما";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("عنوان صفحه الزامی است");
            return;
        }

        try {
            setSaving(true);
            
            const updateData: any = {
                title,
                content,
                short_description: shortDescription || null,
                meta_title: metaTitle || null,
                meta_description: metaDescription || null,
                og_title: ogTitle || null,
                og_description: ogDescription || null,
                canonical_url: canonicalUrl || null,
                robots_meta: robotsMeta || null,
            };

            if (featuredImage) {
                updateData.featured_image = featuredImage.id;
            } else if (page?.featured_image && !featuredImage) {
                updateData.featured_image = null;
            }

            if (ogImage) {
                updateData.og_image = ogImage.id;
            } else if (page?.og_image && !ogImage) {
                updateData.og_image = null;
            }

            await pageApi.updateAboutPage(updateData);
            toast.success("صفحه درباره ما با موفقیت به‌روزرسانی شد");
            await fetchPage();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "خطا در به‌روزرسانی صفحه درباره ما";
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">تنظیمات صفحه درباره ما</h1>
                </div>
                <ProtectedButton 
                    onClick={handleSave} 
                    permission="pages.manage"
                    disabled={saving}
                    showDenyToast={true}
                    denyMessage="شما دسترسی لازم برای مدیریت صفحات وب را ندارید"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin" />
                            در حال ذخیره...
                        </>
                    ) : (
                        <>
                            <Save />
                            ذخیره تغییرات
                        </>
                    )}
                </ProtectedButton>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="base">
                        <FileText className="h-4 w-4 me-2" />
                        اطلاعات پایه
                    </TabsTrigger>
                    <TabsTrigger value="seo">
                        <Search className="h-4 w-4 me-2" />
                        سئو
                    </TabsTrigger>
                </TabsList>

                {activeTab === "base" && (
                    <BaseInfoTab
                        title={title}
                        content={content}
                        shortDescription={shortDescription}
                        featuredImage={featuredImage}
                        onTitleChange={setTitle}
                        onContentChange={setContent}
                        onShortDescriptionChange={setShortDescription}
                        onFeaturedImageChange={setFeaturedImage}
                    />
                )}

                {activeTab === "seo" && (
                    <SEOTab
                        metaTitle={metaTitle}
                        metaDescription={metaDescription}
                        ogTitle={ogTitle}
                        ogDescription={ogDescription}
                        canonicalUrl={canonicalUrl}
                        robotsMeta={robotsMeta}
                        ogImage={ogImage}
                        onMetaTitleChange={setMetaTitle}
                        onMetaDescriptionChange={setMetaDescription}
                        onOgTitleChange={setOgTitle}
                        onOgDescriptionChange={setOgDescription}
                        onCanonicalUrlChange={setCanonicalUrl}
                        onRobotsMetaChange={setRobotsMeta}
                        onOgImageChange={setOgImage}
                    />
                )}
            </Tabs>
        </div>
    );
}
