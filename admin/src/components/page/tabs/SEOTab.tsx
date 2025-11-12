"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import LogoUploader from "@/app/(dashboard)/settings/panel/LogoUploader";
import { Media } from "@/types/shared/media";
import { Search, Image as ImageIcon } from "lucide-react";

interface SEOTabProps {
    metaTitle: string;
    metaDescription: string;
    ogTitle: string;
    ogDescription: string;
    canonicalUrl: string;
    robotsMeta: string;
    ogImage: Media | null;
    onMetaTitleChange: (value: string) => void;
    onMetaDescriptionChange: (value: string) => void;
    onOgTitleChange: (value: string) => void;
    onOgDescriptionChange: (value: string) => void;
    onCanonicalUrlChange: (value: string) => void;
    onRobotsMetaChange: (value: string) => void;
    onOgImageChange: (media: Media | null) => void;
}

export function SEOTab({
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    canonicalUrl,
    robotsMeta,
    ogImage,
    onMetaTitleChange,
    onMetaDescriptionChange,
    onOgTitleChange,
    onOgDescriptionChange,
    onCanonicalUrlChange,
    onRobotsMetaChange,
    onOgImageChange,
}: SEOTabProps) {
    return (
        <div className="space-y-6">
            <CardWithIcon
                icon={Search}
                title="SEO - Meta Tags"
                iconBgColor="bg-emerald"
                iconColor="stroke-emerald-2"
                borderColor="border-b-emerald-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
            >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="meta_title">Meta Title (حداکثر 70 کاراکتر)</Label>
                            <Input
                                id="meta_title"
                                value={metaTitle}
                                onChange={(e) => onMetaTitleChange(e.target.value)}
                                placeholder="عنوان برای SEO"
                                maxLength={70}
                            />
                            <p className="text-xs text-font-s">
                                {metaTitle.length}/70
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="canonical_url">Canonical URL</Label>
                            <Input
                                id="canonical_url"
                                value={canonicalUrl}
                                onChange={(e) => onCanonicalUrlChange(e.target.value)}
                                placeholder="https://example.com/page"
                                type="url"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="meta_description">Meta Description (حداکثر 300 کاراکتر)</Label>
                        <Textarea
                            id="meta_description"
                            value={metaDescription}
                            onChange={(e) => onMetaDescriptionChange(e.target.value)}
                            placeholder="توضیحات برای SEO"
                            rows={3}
                            maxLength={300}
                        />
                        <p className="text-xs text-font-s">
                            {metaDescription.length}/300
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="robots_meta">Robots Meta</Label>
                        <Input
                            id="robots_meta"
                            value={robotsMeta}
                            onChange={(e) => onRobotsMetaChange(e.target.value)}
                            placeholder="index,follow"
                        />
                    </div>
            </CardWithIcon>

            <CardWithIcon
                icon={ImageIcon}
                title="SEO - Open Graph"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
            >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="og_title">OG Title</Label>
                            <Input
                                id="og_title"
                                value={ogTitle}
                                onChange={(e) => onOgTitleChange(e.target.value)}
                                placeholder="عنوان برای شبکه‌های اجتماعی"
                                maxLength={70}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="og_description">OG Description</Label>
                            <Textarea
                                id="og_description"
                                value={ogDescription}
                                onChange={(e) => onOgDescriptionChange(e.target.value)}
                                placeholder="توضیحات برای شبکه‌های اجتماعی"
                                rows={2}
                                maxLength={300}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>OG Image</Label>
                        <LogoUploader
                            label="تصویر Open Graph"
                            selectedMedia={ogImage}
                            onMediaSelect={onOgImageChange}
                            size="md"
                            showLabel={false}
                        />
                    </div>
            </CardWithIcon>
        </div>
    );
}

