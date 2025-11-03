"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { Input } from '@/components/elements/Input';
import { Textarea } from '@/components/elements/Textarea';
import { Checkbox } from '@/components/elements/Checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import { aiApi, AvailableProvider, AIContentGenerationResponse } from '@/api/ai/route';
import { Loader2, Sparkles, FileText, Settings, AlertCircle, Copy, Check } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';

interface AIContentGeneratorProps {
    onNavigateToSettings?: () => void;
}

export function AIContentGenerator({ onNavigateToSettings }: AIContentGeneratorProps) {
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [topic, setTopic] = useState('');
    const [wordCount, setWordCount] = useState(500);
    const [tone, setTone] = useState('professional');
    const [keywords, setKeywords] = useState('');
    const [saveToCache, setSaveToCache] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<AIContentGenerationResponse | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        fetchAvailableProviders();
    }, []);

    const fetchAvailableProviders = async () => {
        try {
            setLoadingProviders(true);
            const response = await aiApi.content.getAvailableProviders();
            
            if (response.metaData.status === 'success') {
                const providersData = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data as any)?.data || [];
                
                setAvailableProviders(providersData);
                
                if (providersData.length > 0 && !selectedProvider) {
                    setSelectedProvider(providersData[0].provider_name);
                }
            }
        } catch (error: any) {
            // فقط Toast از metaData.message اگر موجود بود
            const msg = error?.response?.data?.metaData?.message || 'خطا در دریافت لیست Provider های فعال';
            toast.error(msg);
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProvider) {
            toast.error('لطفاً یک مدل AI انتخاب کنید');
            return;
        }

        if (!topic.trim()) {
            toast.error('لطفاً موضوع محتوا را وارد کنید');
            return;
        }

        try {
            setGenerating(true);
            setGeneratedContent(null);

            const keywordsArray = keywords.trim()
                ? keywords.split(',').map(k => k.trim()).filter(k => k)
                : [];

            const response = await aiApi.content.generateContent({
                provider_name: selectedProvider,
                topic: topic.trim(),
                word_count: wordCount,
                tone: tone,
                keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
                save_to_cache: saveToCache,
            });

            if (response.metaData.status === 'success') {
                setGeneratedContent(response.data);
                toast.success(
                    response.data.cached 
                        ? 'محتوا از cache بازیابی شد' 
                        : 'محتوا با موفقیت تولید شد'
                );
            }
        } catch (error: any) {
            let errorMessage = 'خطا در تولید محتوا';
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.response?.data?.metaData?.message) {
                errorMessage = error.response.data.metaData.message;
            }
            toast.error(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            toast.success('کپی شد');
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            toast.error('خطا در کپی کردن');
        }
    };

    if (loadingProviders) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (availableProviders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        هیچ Provider فعالی یافت نشد
                    </CardTitle>
                    <CardDescription>
                        برای استفاده از تولید محتوا با AI، باید یکی از Provider های زیر را فعال کنید:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>Google Gemini</strong> - برای تولید محتوا (رایگان)</li>
                            <li><strong>OpenAI GPT</strong> - برای تولید محتوا (پولی)</li>
                            <li><strong>DeepSeek AI</strong> - برای تولید محتوا (رایگان)</li>
                        </ul>
                        <p className="mt-2 text-sm text-muted-foreground">
                            توجه: HuggingFace فقط برای تولید تصویر است و برای محتوا پشتیبانی نمی‌شود.
                        </p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={onNavigateToSettings} variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        رفتن به تنظیمات AI
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Input Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        تولید محتوای SEO با AI
                    </CardTitle>
                    <CardDescription>
                        محتوای بهینه شده برای SEO با متا تگ‌ها، عناوین و کلمات کلیدی
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="provider">مدل AI</Label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                            <SelectTrigger id="provider">
                                <SelectValue placeholder="انتخاب مدل AI" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableProviders.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.provider_name}>
                                        {provider.provider_display || provider.provider_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Topic Input */}
                    <div className="space-y-2">
                        <Label htmlFor="topic">موضوع محتوا *</Label>
                        <Textarea
                            id="topic"
                            placeholder="مثال: راهنمای کامل طراحی وب سایت"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Word Count */}
                        <div className="space-y-2">
                            <Label htmlFor="wordCount">تعداد کلمات</Label>
                            <Input
                                id="wordCount"
                                type="number"
                                min={100}
                                max={2000}
                                value={wordCount}
                                onChange={(e) => setWordCount(Number(e.target.value))}
                            />
                        </div>

                        {/* Tone */}
                        <div className="space-y-2">
                            <Label htmlFor="tone">سبک محتوا</Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger id="tone">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">حرفه‌ای</SelectItem>
                                    <SelectItem value="friendly">دوستانه</SelectItem>
                                    <SelectItem value="formal">رسمی</SelectItem>
                                    <SelectItem value="casual">غیررسمی</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="space-y-2">
                        <Label htmlFor="keywords">کلمات کلیدی (جدا شده با کاما)</Label>
                        <Input
                            id="keywords"
                            placeholder="مثال: طراحی وب, UI/UX, React"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                        />
                    </div>

                    {/* Save to Cache */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                            id="saveToCache"
                            checked={saveToCache}
                            onCheckedChange={(checked) => setSaveToCache(checked === true)}
                        />
                        <Label
                            htmlFor="saveToCache"
                            className="text-sm font-normal cursor-pointer"
                        >
                            ذخیره محتوا در cache (برای استفاده مجدد)
                        </Label>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !topic.trim()}
                        className="w-full"
                        size="lg"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                در حال تولید...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                تولید محتوا
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Generated Content */}
            {generatedContent && (
                <div className="space-y-4">
                    {/* SEO Meta Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                اطلاعات SEO
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>عنوان متا (Meta Title)</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedContent.meta_title, 'meta_title')}
                                    >
                                        {copiedField === 'meta_title' ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <Input value={generatedContent.meta_title} readOnly />
                                <p className="text-xs text-muted-foreground">
                                    {generatedContent.meta_title.length} کاراکتر
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>توضیحات متا (Meta Description)</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedContent.meta_description, 'meta_description')}
                                    >
                                        {copiedField === 'meta_description' ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <Textarea value={generatedContent.meta_description} readOnly rows={2} />
                                <p className="text-xs text-muted-foreground">
                                    {generatedContent.meta_description.length} کاراکتر
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Slug</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedContent.slug, 'slug')}
                                    >
                                        {copiedField === 'slug' ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <Input value={generatedContent.slug} readOnly />
                            </div>

                            <div className="space-y-2">
                                <Label>کلمات کلیدی</Label>
                                <div className="flex flex-wrap gap-2">
                                    {generatedContent.keywords.map((keyword, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-secondary rounded-md text-sm"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{generatedContent.h1}</CardTitle>
                            <CardDescription>
                                {generatedContent.word_count} کلمه | 
                                زمان تولید: {generatedContent.generation_time_ms}ms |
                                {generatedContent.cached && ' (از cache)'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {generatedContent.h2_list.length > 0 && (
                                <div className="space-y-2">
                                    <Label>عناوین H2:</Label>
                                    <ul className="list-disc list-inside space-y-1">
                                        {generatedContent.h2_list.map((h2, index) => (
                                            <li key={index} className="text-sm">{h2}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {generatedContent.h3_list.length > 0 && (
                                <div className="space-y-2">
                                    <Label>عناوین H3:</Label>
                                    <ul className="list-disc list-inside space-y-1">
                                        {generatedContent.h3_list.map((h3, index) => (
                                            <li key={index} className="text-sm">{h3}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>محتوای اصلی</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedContent.content, 'content')}
                                    >
                                        {copiedField === 'content' ? (
                                            <Check className="h-4 w-4 mr-2" />
                                        ) : (
                                            <Copy className="h-4 w-4 mr-2" />
                                        )}
                                        کپی محتوا
                                    </Button>
                                </div>
                                <div className="p-4 bg-muted rounded-md prose prose-sm max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: generatedContent.content.replace(/\n/g, '<br />') }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

