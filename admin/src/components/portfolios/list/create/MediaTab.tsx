"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { PortfolioMediaGallery } from "@/components/portfolios";
import { Media } from "@/types/shared/media";
import { Image, Plus, FolderOpen, Tag, X } from "lucide-react";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";

interface PortfolioMedia {
    featuredImage: Media | null;
    imageGallery: Media[];
    videoGallery: Media[];
    audioGallery: Media[];
    pdfDocuments: Media[];
}

interface MediaTabProps {
    portfolioMedia: PortfolioMedia;
    setPortfolioMedia: (media: PortfolioMedia) => void;
    editMode: boolean;
}

export default function MediaTab({ portfolioMedia, setPortfolioMedia, editMode }: MediaTabProps) {
    const [categories, setCategories] = useState<PortfolioCategory[]>([]);
    const [tags, setTags] = useState<PortfolioTag[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<PortfolioTag[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);

    useEffect(() => {
        // Fetch categories
        const fetchCategories = async () => {
            try {
                const response = await portfolioApi.getCategories({ page: 1, size: 100 });
                setCategories(response.data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoadingCategories(false);
            }
        };

        // Fetch tags
        const fetchTags = async () => {
            try {
                const response = await portfolioApi.getTags({ page: 1, size: 100 });
                setTags(response.data || []);
            } catch (error) {
                console.error("Error fetching tags:", error);
            } finally {
                setLoadingTags(false);
            }
        };

        fetchCategories();
        fetchTags();
    }, []);

    const handleFeaturedImageSelect = (media: Media | null) => {
        setPortfolioMedia({
            ...portfolioMedia,
            featuredImage: media
        });
    };

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        // Here you would typically update the parent component with the selected category
        console.log("Selected category:", value);
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
        // Here you would typically update the parent component with the selected tags
        console.log("Selected tags:", selectedTags);
    };

    const removeTag = (tagId: number) => {
        setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
    };

    return (
        <TabsContent value="media" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>مدیا</CardTitle>
                                <CardDescription>مدیریت تصاویر و فایل‌های رسانه‌ای</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Featured Image Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">تصویر شاخص</h3>
                                    <MediaSelector
                                        selectedMedia={portfolioMedia.featuredImage}
                                        onMediaSelect={handleFeaturedImageSelect}
                                        label="تصویر شاخص"
                                        size="lg"
                                    />
                                </div>

                                {/* Image Gallery Section */}
                                <PortfolioMediaGallery
                                    mediaItems={portfolioMedia.imageGallery}
                                    onMediaSelect={(media) => setPortfolioMedia({ ...portfolioMedia, imageGallery: media })}
                                    mediaType="image"
                                    title="گالری تصاویر"
                                    isGallery={true}
                                />

                                {/* Video Gallery Section - Single video with cover */}
                                <PortfolioMediaGallery
                                    mediaItems={portfolioMedia.videoGallery}
                                    onMediaSelect={(media) => setPortfolioMedia({ ...portfolioMedia, videoGallery: media })}
                                    mediaType="video"
                                    title="ویدئو"
                                    isGallery={false}
                                    maxSelection={1}
                                />

                                {/* Audio Gallery Section - Single audio with cover */}
                                <PortfolioMediaGallery
                                    mediaItems={portfolioMedia.audioGallery}
                                    onMediaSelect={(media) => setPortfolioMedia({ ...portfolioMedia, audioGallery: media })}
                                    mediaType="audio"
                                    title="فایل صوتی"
                                    isGallery={false}
                                    maxSelection={1}
                                />

                                {/* PDF Documents Section - Single PDF with cover */}
                                <PortfolioMediaGallery
                                    mediaItems={portfolioMedia.pdfDocuments}
                                    onMediaSelect={(media) => setPortfolioMedia({ ...portfolioMedia, pdfDocuments: media })}
                                    mediaType="pdf"
                                    title="مستندات PDF"
                                    isGallery={false}
                                    maxSelection={1}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <Card className="lg:sticky lg:top-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">تنظیمات</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-2 w-full">
                                <Label htmlFor="category" className="flex items-center gap-2">
                                    <FolderOpen className="w-4 h-4 text-blue-500" />
                                    دسته‌بندی *
                                </Label>
                                <div className="flex gap-4 w-full">
                                    <div className="flex-1">
                                        <Select 
                                            disabled={!editMode || loadingCategories}
                                            value={selectedCategory}
                                            onValueChange={handleCategoryChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={loadingCategories ? "در حال بارگذاری..." : "دسته‌بندی را انتخاب کنید"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={String(category.id)}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="p-0 bg-blue-50 hover:bg-blue-100 border-blue-200 flex-shrink-0"
                                        style={{ height: '34px', width: '34px' }}
                                        disabled={!editMode}
                                    >
                                        <Plus className="w-3 h-3 text-blue-600" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2 w-full">
                                <Label htmlFor="tags" className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-green-500" />
                                    تگ‌ها *
                                </Label>
                                <div className="space-y-2">
                                    {/* Display selected tags */}
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTags.map(tag => (
                                            <span 
                                                key={tag.id} 
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                            >
                                                {tag.name}
                                                <button 
                                                    type="button" 
                                                    className="ml-1 text-green-800 hover:text-green-900"
                                                    onClick={() => removeTag(tag.id)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    
                                    {/* Tag selection dropdown */}
                                    <div className="flex gap-4 w-full">
                                        <div className="flex-1">
                                            <Select 
                                                disabled={!editMode || loadingTags}
                                                onValueChange={(value) => {
                                                    const tag = tags.find(t => String(t.id) === value);
                                                    if (tag) handleTagToggle(tag);
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={loadingTags ? "در حال بارگذاری..." : "تگ‌ها را انتخاب کنید"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tags
                                                        .filter(tag => !selectedTags.some(selected => selected.id === tag.id))
                                                        .map((tag) => (
                                                            <SelectItem 
                                                                key={tag.id} 
                                                                value={String(tag.id)}
                                                            >
                                                                {tag.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="p-0 bg-green-50 hover:bg-green-100 border-green-200 flex-shrink-0"
                                            style={{ height: '34px', width: '34px' }}
                                            disabled={!editMode}
                                        >
                                            <Plus className="w-3 h-3 text-green-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>
    );
}