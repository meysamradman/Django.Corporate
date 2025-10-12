"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Button } from "@/components/elements/Button";
import { TipTapEditor } from "@/components/forms/TipTapEditor";
import { FileText, Plus, FolderOpen, Tag } from "lucide-react";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import slugify from "slugify";

interface BaseInfoTabProps {
    formData: any;
    handleInputChange: (field: string, value: string) => void;
    editMode: boolean;
}

export default function BaseInfoTab({ formData, handleInputChange, editMode }: BaseInfoTabProps) {
    const [categories, setCategories] = useState<PortfolioCategory[]>([]);
    const [tags, setTags] = useState<PortfolioTag[]>([]);
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

    // Automatically generate slug from name when name changes and slug is empty
    useEffect(() => {
        if (formData.name && !formData.slug) {
            const generatedSlug = slugify(formData.name, { 
                lower: true, 
                strict: true,
                locale: 'en' // Use English locale for consistency
            });
            handleInputChange("slug", generatedSlug);
        }
    }, [formData.name]);

    return (
        <TabsContent value="account" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>اطلاعات پایه</CardTitle>
                                <CardDescription>اطلاعات اصلی نمونه‌کار</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">نام *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            disabled={!editMode}
                                            placeholder="نام نمونه‌کار"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">لینک (اسلاگ) *</Label>
                                        <Input
                                            id="slug"
                                            value={formData.slug}
                                            onChange={(e) => handleInputChange("slug", e.target.value)}
                                            disabled={!editMode}
                                            placeholder="my-portfolio-item"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="short_description">توضیحات کوتاه *</Label>
                                    <Textarea
                                        id="short_description"
                                        value={formData.short_description}
                                        onChange={(e) => handleInputChange("short_description", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="یک توضیح کوتاه درباره نمونه‌کار..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">توضیحات بلند *</Label>
                                    <TipTapEditor
                                        content={formData.description}
                                        onChange={(content: string) => handleInputChange("description", content)}
                                        placeholder="توضیحات کامل نمونه‌کار را وارد کنید..."
                                    />
                                </div>
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
                                        <Select disabled={!editMode || loadingCategories}>
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
                                <div className="flex gap-4 w-full">
                                    <div className="flex-1">
                                        <Select disabled={!editMode || loadingTags}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={loadingTags ? "در حال بارگذاری..." : "تگ‌ها را انتخاب کنید"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tags.map((tag) => (
                                                    <SelectItem key={tag.id} value={String(tag.id)}>
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>
    );
}