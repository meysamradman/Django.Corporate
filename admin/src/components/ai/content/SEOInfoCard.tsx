"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { Input } from '@/components/elements/Input';
import { Textarea } from '@/components/elements/Textarea';
import { AIContentGenerationResponse } from '@/api/ai/route';
import { FileText, Copy, Check } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { msg } from '@/core/messages/message';

interface SEOInfoCardProps {
    content: AIContentGenerationResponse;
    copiedField: string | null;
    onCopy: (text: string, fieldName: string) => void;
}

export function SEOInfoCard({ content, copiedField, onCopy }: SEOInfoCardProps) {
    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-cyan-500">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-100 rounded-xl shadow-sm">
                        <FileText className="w-5 h-5 stroke-cyan-600" />
                    </div>
                    اطلاعات SEO
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">عنوان متا (Meta Title)</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopy(content.meta_title, 'meta_title')}
                            className="h-8"
                        >
                            {copiedField === 'meta_title' ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <Input value={content.meta_title} readOnly className="h-11 font-medium" />
                    <p className="text-xs text-muted-foreground">
                        {content.meta_title.length} کاراکتر
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">توضیحات متا (Meta Description)</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopy(content.meta_description, 'meta_description')}
                            className="h-8"
                        >
                            {copiedField === 'meta_description' ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <Textarea value={content.meta_description} readOnly rows={3} className="resize-none" />
                    <p className="text-xs text-muted-foreground">
                        {content.meta_description.length} کاراکتر
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Slug</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopy(content.slug, 'slug')}
                            className="h-8"
                        >
                            {copiedField === 'slug' ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <Input value={content.slug} readOnly className="h-11 font-mono text-sm" />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold">کلمات کلیدی</Label>
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
                        {content.keywords.map((keyword, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium border border-primary/20"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

