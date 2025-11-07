"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
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
        <div className="space-y-6 mt-6">
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-blue-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-xl shadow-sm">
                            <FileText className="w-5 h-5 stroke-blue-600" />
                        </div>
                        <CardTitle>اطلاعات پایه</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-orange-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-100 rounded-xl shadow-sm">
                            <ImageIcon className="w-5 h-5 stroke-orange-600" />
                        </div>
                        <CardTitle>تصویر شاخص</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4" />
                    <LogoUploader
                        label="تصویر شاخص"
                        selectedMedia={featuredImage}
                        onMediaSelect={onFeaturedImageChange}
                        size="md"
                        showLabel={false}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

