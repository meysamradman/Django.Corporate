import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { Input } from '@/components/elements/Input';
import { Textarea } from '@/components/elements/Textarea';
import type { AIContentGenerationResponse } from '@/types/ai/ai';
import { FileText, Copy, Check } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { getAI, getAIUI } from '@/core/messages/modules/ai';

interface SEOInfoCardProps {
    content: AIContentGenerationResponse;
    copiedField: string | null;
    onCopy: (text: string, fieldName: string) => void;
}

export function SEOInfoCard({ content, copiedField, onCopy }: SEOInfoCardProps) {
    return (
        <CardWithIcon
            icon={FileText}
            title="اطلاعات SEO"
            iconBgColor="bg-emerald"
            iconColor="stroke-emerald-2"
            borderColor="border-b-emerald-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3"
        >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">عنوان متا (Meta Title)</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onCopy(content.meta_title, 'meta_title')}
                                className="h-8"
                            >
                                {copiedField === 'meta_title' ? (
                                    <Check className="h-4 w-4 text-green-1" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <Input value={content.meta_title} readOnly className="h-11 font-medium" />
                        <p className="text-xs text-font-s">
                            {content.meta_title.length} کاراکتر
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">توضیحات متا (Meta Description)</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onCopy(content.meta_description, 'meta_description')}
                                className="h-8"
                            >
                                {copiedField === 'meta_description' ? (
                                    <Check className="h-4 w-4 text-green-1" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <Textarea value={content.meta_description} readOnly rows={3} className="resize-none" />
                        <p className="text-xs text-font-s">
                            {content.meta_description.length} کاراکتر
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Slug</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onCopy(content.slug, 'slug')}
                                className="h-8"
                            >
                                {copiedField === 'slug' ? (
                                    <Check className="h-4 w-4 text-green-1" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <Input value={content.slug} readOnly className="h-11 font-mono text-sm" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">کلمات کلیدی</Label>
                        <div className="flex flex-wrap gap-2 p-3 bg-bg/50 rounded-lg border">
                            {content.keywords.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium border border-primary/20"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
        </CardWithIcon>
    );
}

