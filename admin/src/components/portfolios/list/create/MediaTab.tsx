"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { PortfolioMediaGallery } from "@/components/portfolios";
import { Media } from "@/types/shared/media";
import { Image } from "lucide-react";
import { portfolioApi } from "@/api/portfolios/route";

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
    const handleFeaturedImageSelect = (media: Media | null) => {
        setPortfolioMedia({
            ...portfolioMedia,
            featuredImage: media
        });
    };

    return (
        <TabsContent value="media" className="mt-6">
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
        </TabsContent>
    );
}