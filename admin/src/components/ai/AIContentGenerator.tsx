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
import { Loader2, Sparkles, FileText, Settings, AlertCircle, Copy, Check, Brain, Type, Hash, MessageSquare } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';

interface AIContentGeneratorProps {
    onNavigateToSettings?: () => void;
}

const getProviderDisplayName = (provider: AvailableProvider): string => {
    const providerMap: Record<string, string> = {
        'gemini': 'مدل Google Gemini',
        'openai': 'مدل OpenAI GPT',
        'deepseek': 'مدل DeepSeek',
        'huggingface': 'مدل Hugging Face',
    };
    
    if (provider.provider_display) {
        const name = provider.provider_display.toLowerCase();
        if (name.includes('gemini')) return 'مدل Google Gemini';
        if (name.includes('openai') || name.includes('gpt')) return 'مدل OpenAI GPT';
        if (name.includes('deepseek')) return 'مدل DeepSeek';
        if (name.includes('hugging')) return 'مدل Hugging Face';
    }
    
    return providerMap[provider.provider_name.toLowerCase()] || `مدل ${provider.provider_name}`;
};

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
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-yellow-500">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 bg-yellow-100 rounded-xl shadow-sm">
                            <AlertCircle className="w-5 h-5 stroke-yellow-600" />
                        </div>
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
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-primary">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
                            <Sparkles className="w-5 h-5 stroke-primary" />
                        </div>
                        تولید محتوای SEO با AI
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="provider" className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-muted-foreground" />
                            مدل AI
                        </Label>
                        <Select value={selectedProvider || undefined} onValueChange={setSelectedProvider}>
                            <SelectTrigger id="provider" className="h-11">
                                <SelectValue placeholder="انتخاب مدل" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableProviders.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.provider_name}>
                                        {getProviderDisplayName(provider)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Topic Input */}
                    <div className="space-y-2">
                        <Label htmlFor="topic" className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-muted-foreground" />
                            موضوع محتوا <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="topic"
                            placeholder="مثال: راهنمای کامل طراحی وب سایت"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Word Count */}
                        <div className="space-y-2">
                            <Label htmlFor="wordCount" className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-muted-foreground" />
                                تعداد کلمات
                            </Label>
                            <Input
                                id="wordCount"
                                type="number"
                                min={100}
                                max={2000}
                                value={wordCount}
                                onChange={(e) => setWordCount(Number(e.target.value))}
                                className="h-11"
                            />
                            <p className="text-xs text-muted-foreground">
                                بین 100 تا 2000 کلمه
                            </p>
                        </div>

                        {/* Tone */}
                        <div className="space-y-2">
                            <Label htmlFor="tone" className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                سبک محتوا
                            </Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger id="tone" className="h-11">
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
                        <Label htmlFor="keywords" className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            کلمات کلیدی (اختیاری)
                        </Label>
                        <Input
                            id="keywords"
                            placeholder="مثال: طراحی وب, UI/UX, React"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                            کلمات کلیدی را با کاما جدا کنید
                        </p>
                    </div>

                    {/* Save to Cache */}
                    <div className="flex items-center space-x-2 space-x-reverse p-3 bg-muted/50 rounded-lg border">
                        <Checkbox
                            id="saveToCache"
                            checked={saveToCache}
                            onCheckedChange={(checked) => setSaveToCache(checked === true)}
                        />
                        <Label
                            htmlFor="saveToCache"
                            className="text-sm font-normal cursor-pointer flex-1"
                        >
                            ذخیره محتوا در cache (برای استفاده مجدد)
                        </Label>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !topic.trim()}
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                در حال تولید محتوا...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5 mr-2" />
                                تولید محتوای SEO
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Generated Content */}
            {generatedContent && (
                <div className="space-y-4">
                    {/* SEO Meta Tags */}
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
                                        onClick={() => copyToClipboard(generatedContent.meta_title, 'meta_title')}
                                        className="h-8"
                                    >
                                        {copiedField === 'meta_title' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <Input value={generatedContent.meta_title} readOnly className="h-11 font-medium" />
                                <p className="text-xs text-muted-foreground">
                                    {generatedContent.meta_title.length} کاراکتر
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">توضیحات متا (Meta Description)</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedContent.meta_description, 'meta_description')}
                                        className="h-8"
                                    >
                                        {copiedField === 'meta_description' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <Textarea value={generatedContent.meta_description} readOnly rows={3} className="resize-none" />
                                <p className="text-xs text-muted-foreground">
                                    {generatedContent.meta_description.length} کاراکتر
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Slug</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedContent.slug, 'slug')}
                                        className="h-8"
                                    >
                                        {copiedField === 'slug' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <Input value={generatedContent.slug} readOnly className="h-11 font-mono text-sm" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">کلمات کلیدی</Label>
                                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
                                    {generatedContent.keywords.map((keyword, index) => (
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

                    {/* Content */}
                    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
                        <CardHeader className="pb-3 border-b">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                                    <FileText className="w-5 h-5 stroke-indigo-600" />
                                </div>
                                <CardTitle>{generatedContent.h1}</CardTitle>
                            </div>
                            <CardDescription>
                                {generatedContent.word_count} کلمه | 
                                زمان تولید: {generatedContent.generation_time_ms}ms |
                                {generatedContent.cached && ' (از cache)'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {generatedContent.h2_list.length > 0 && (
                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                                    <Label className="text-sm font-semibold">عناوین H2:</Label>
                                    <ul className="space-y-2">
                                        {generatedContent.h2_list.map((h2, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <span className="text-primary font-bold mt-0.5">{index + 1}.</span>
                                                <span className="flex-1">{h2}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {generatedContent.h3_list.length > 0 && (
                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                                    <Label className="text-sm font-semibold">عناوین H3:</Label>
                                    <ul className="space-y-2">
                                        {generatedContent.h3_list.map((h3, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <span className="text-primary font-bold mt-0.5">{index + 1}.</span>
                                                <span className="flex-1">{h3}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">محتوای اصلی</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedContent.content, 'content')}
                                        className="h-8"
                                    >
                                        {copiedField === 'content' ? (
                                            <>
                                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                                کپی شد
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-2" />
                                                کپی محتوا
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="p-5 bg-muted/30 rounded-lg border prose prose-sm max-w-none">
                                    <div 
                                        className="text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: generatedContent.content.replace(/\n/g, '<br />') }} 
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

