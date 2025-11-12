"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { TipTapEditor } from "@/components/forms/TipTapEditor";
import LogoUploader from "@/app/(dashboard)/settings/panel/LogoUploader";
import { Media } from "@/types/shared/media";
import { FileText, Image as ImageIcon } from "lucide-react";

interface BaseInfoTabProps {
    title: string;
    content: string;
    shortDescription: string;
    featuredImage: Media | null;
    onTitleChange: (value: string) => void;
    onContentChange: (value: string) => void;
    onShortDescriptionChange: (value: string) => void;
    onFeaturedImageChange: (media: Media | null) => void;
}

export function BaseInfoTab({
    title,
    content,
    shortDescription,
    featuredImage,
    onTitleChange,
    onContentChange,
    onShortDescriptionChange,
    onFeaturedImageChange,
}: BaseInfoTabProps) {
    return (
        <div className="space-y-6">
            <CardWithIcon
                icon={FileText}
                title="اطلاعات پایه"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
            >
                    <div className="space-y-2">
                        <Label htmlFor="title">عنوان صفحه</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            placeholder="عنوان صفحه"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="short_description">توضیح کوتاه</Label>
                        <Textarea
                            id="short_description"
                            value={shortDescription}
                            onChange={(e) => onShortDescriptionChange(e.target.value)}
                            placeholder="خلاصه کوتاه از محتوای صفحه"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">محتوای صفحه</Label>
                        <TipTapEditor
                            content={content}
                            onChange={onContentChange}
                            placeholder="محتوای صفحه را وارد کنید... می‌توانید از عکس، لینک و فرمت‌های مختلف استفاده کنید"
                        />
                    </div>
            </CardWithIcon>

            <CardWithIcon
                icon={ImageIcon}
                title="تصویر شاخص"
                iconBgColor="bg-orange"
                iconColor="stroke-orange-2"
                borderColor="border-b-orange-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
            >
                    <div className="mb-4" />
                    <LogoUploader
                        label="تصویر شاخص"
                        selectedMedia={featuredImage}
                        onMediaSelect={onFeaturedImageChange}
                        size="md"
                        showLabel={false}
                    />
            </CardWithIcon>
        </div>
    );
}

