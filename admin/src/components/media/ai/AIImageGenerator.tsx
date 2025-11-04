"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Textarea';
import { Checkbox } from '@/components/elements/Checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import { aiApi } from '@/api/ai/route';
import { mediaApi } from '@/api/media/route';
import { Media } from '@/types/shared/media';
import { Loader2, Sparkles, Wand2, Image as ImageIcon, Settings, AlertCircle, Save, Brain } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';
import { MediaImage } from '@/components/media/base/MediaImage';

interface AvailableProvider {
    id: number;
    provider_name: string;
    provider_display: string;
    can_generate: boolean;
}

const getProviderDisplayName = (provider: AvailableProvider): string => {
    const providerMap: Record<string, string> = {
        'gemini': 'مدل Google Gemini',
        'openai': 'مدل OpenAI DALL-E',
        'deepseek': 'مدل DeepSeek',
        'huggingface': 'مدل Hugging Face',
        'dall-e': 'مدل OpenAI DALL-E',
    };
    
    if (provider.provider_display) {
        const name = provider.provider_display.toLowerCase();
        if (name.includes('gemini')) return 'مدل Google Gemini';
        if (name.includes('openai') || name.includes('dall-e') || name.includes('dalle')) return 'مدل OpenAI DALL-E';
        if (name.includes('deepseek')) return 'مدل DeepSeek';
        if (name.includes('hugging')) return 'مدل Hugging Face';
    }
    
    return providerMap[provider.provider_name.toLowerCase()] || `مدل ${provider.provider_name}`;
};

interface AIImageGeneratorProps {
    onImageGenerated?: (media: Media) => void;
    onSelectGenerated?: (media: Media) => void;
    onNavigateToSettings?: () => void;
}

export function AIImageGenerator({ onImageGenerated, onSelectGenerated, onNavigateToSettings }: AIImageGeneratorProps) {
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [prompt, setPrompt] = useState('');
    // استفاده از مقادیر پیش‌فرض - نیازی به نمایش در UI نیست
    const size = '1024x1024';
    const quality = 'standard';
    const [saveToDb, setSaveToDb] = useState(false); // پیش‌فرض: ذخیره نشود (سریع‌تر)
    const [generating, setGenerating] = useState(false);
    const [generatedMedia, setGeneratedMedia] = useState<Media | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null); // برای تصاویر ذخیره نشده

    useEffect(() => {
        fetchAvailableProviders();
    }, []);

    const fetchAvailableProviders = async () => {
        try {
            setLoadingProviders(true);
            const response = await aiApi.image.getAvailableProviders();
            if (response.metaData.status === 'success') {
                // Handle different response formats:
                // 1. Direct array: response.data = [...]
                // 2. Object with data property: response.data = {data: [...], count: ...}
                let providersData: any[] = [];
                
                if (Array.isArray(response.data)) {
                    providersData = response.data;
                } else if (response.data && typeof response.data === 'object') {
                    const dataObj = response.data as any;
                    if ('data' in dataObj && Array.isArray(dataObj.data)) {
                        providersData = dataObj.data;
                    }
                }
                
                // فیلتر کردن provider هایی که می‌توانند تصویر تولید کنند
                // Gemini نیاز به Vertex AI دارد - از لیست حذف می‌شود
                const providers = providersData.filter((p: AvailableProvider) => 
                    p.can_generate && p.provider_name !== 'gemini'
                );
                    
                setAvailableProviders(providers);
                
                // اگر provider انتخاب شده دیگر در لیست نیست، آن را پاک کن
                if (selectedProvider && !providers.some(p => p.provider_name === selectedProvider)) {
                    setSelectedProvider('');
                }
            }
        } catch (error) {
            console.error('Error fetching available providers:', error);
            toast.error('خطا در دریافت لیست Provider های فعال');
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProvider) {
            toast.error('لطفاً یک مدل AI انتخاب کنید');
            return;
        }

        if (!prompt.trim()) {
            toast.error('لطفاً توضیحات تصویر را وارد کنید');
            return;
        }

        try {
            setGenerating(true);
            setGeneratedMedia(null);

            const response = await aiApi.image.generateImage({
                provider_name: selectedProvider,
                prompt: prompt.trim(),
                size,
                quality,
                save_to_db: saveToDb,
            });

            if (response.metaData.status === 'success') {
                const data = response.data as any; // Response may contain saved/image_data_url
                
                if ((data as any).saved === false && (data as any).image_data_url) {
                    // تصویر ذخیره نشده - فقط نمایش
                    setGeneratedImageUrl((data as any).image_data_url);
                    setGeneratedMedia(null);
                    toast.success('تصویر با موفقیت تولید شد (ذخیره نشده)');
                } else {
                    // تصویر ذخیره شده
                    setGeneratedMedia(data as Media);
                    setGeneratedImageUrl(null);
                    toast.success('تصویر با موفقیت تولید و ذخیره شد');
                    onImageGenerated?.(data as Media);
                }
                
                // Refresh providers to update usage count
                fetchAvailableProviders();
            }
        } catch (error: any) {
            let errorMessage = 'خطا در تولید تصویر';
            
            // بررسی نوع خطا
            if (error?.response?.data?.metaData?.message) {
                // خطا از APIResponse
                errorMessage = error.response.data.metaData.message;
            } else if (error?.response?.data?.errors) {
                // خطاهای validation
                const validationErrors = error.response.data.errors;
                if (validationErrors.provider_name) {
                    errorMessage = validationErrors.provider_name[0] || errorMessage;
                } else {
                    errorMessage = Object.values(validationErrors).flat().join('، ') || errorMessage;
                }
            } else if (error?.response?.data?.detail) {
                // خطاهای عمومی
                errorMessage = error.response.data.detail;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            // بررسی timeout
            if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
                errorMessage = 'زمان تولید تصویر به پایان رسید. لطفاً دوباره تلاش کنید.\n\nنکته: Hugging Face ممکن است مدل را در حال لود کردن باشد.';
            }
            
            // بررسی پیام خطا برای تشخیص مشکل فعال بودن
            if (errorMessage.includes('فعال نیست') || errorMessage.includes('API key')) {
                errorMessage += ' لطفاً به بخش تنظیمات بروید و provider را فعال کنید.';
            }
            
            // نمایش خطا
            toast.error(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const handleSelect = () => {
        if (generatedMedia) {
            onSelectGenerated?.(generatedMedia);
        }
    };

    const handleReset = () => {
        setPrompt('');
        setGeneratedMedia(null);
        setGeneratedImageUrl(null);
    };
    
    const handleSaveToDb = async () => {
        if (!generatedImageUrl) return;
        
        // تبدیل base64 به blob و ارسال به سرور برای ذخیره
        try {
            const response = await fetch(generatedImageUrl);
            const blob = await response.blob();
            
            // ساخت FormData
            const formData = new FormData();
            formData.append('file', blob, `ai_generated_${Date.now()}.png`);
            formData.append('title', prompt.substring(0, 100));
            formData.append('alt_text', prompt.substring(0, 200));
            
            // ارسال به API upload
            const uploadResponse = await mediaApi.uploadMedia(formData);
            
            if (uploadResponse.metaData.status === 'success') {
                const media = uploadResponse.data;
                setGeneratedMedia(media);
                setGeneratedImageUrl(null);
                toast.success('تصویر در دیتابیس ذخیره شد');
                onImageGenerated?.(media);
            }
        } catch (error: any) {
            toast.error('خطا در ذخیره تصویر: ' + (error.message || 'خطای نامشخص'));
        }
    };

    if (loadingProviders) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (availableProviders.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center space-y-4">
                        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">هیچ مدل AI فعالی برای تولید تصویر وجود ندارد</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                برای تولید تصویر با AI، باید:
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-right" dir="rtl">
                                <li>به تب <strong>"تنظیمات AI"</strong> بروید</li>
                                <li>برای یک مدل AI (مثل <strong>OpenAI DALL-E</strong>) API key وارد کنید</li>
                                <li>API key را <strong>ذخیره</strong> کنید</li>
                                <li>Switch را <strong>فعال</strong> کنید</li>
                            </ol>
                            {onNavigateToSettings && (
                                <div className="mt-6">
                                    <Button 
                                        onClick={onNavigateToSettings}
                                        variant="default"
                                        className="gap-2"
                                    >
                                        <Settings className="h-4 w-4" />
                                        رفتن به تنظیمات AI
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-primary">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
                            <Wand2 className="w-5 h-5 stroke-primary" />
                        </div>
                        تولید تصویر با AI
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                    <div className="space-y-2">
                        <Label htmlFor="prompt">
                            توضیحات تصویر <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="prompt"
                            placeholder="مثال: a beautiful cat, professional photography, high quality..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-blue-900 mb-1">💡 نکته برای کیفیت بهتر:</p>
                                <p>برای نتیجه بهتر، توضیحات را به <strong>انگلیسی</strong> بنویسید. مثال: "a beautiful cat, high quality, detailed"</p>
                                <p className="mt-1 text-xs">سیستم به صورت خودکار کلمات کلیدی کیفیت را اضافه می‌کند.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Checkbox
                            id="save-to-db"
                            checked={saveToDb}
                            onCheckedChange={(checked) => setSaveToDb(checked === true)}
                        />
                        <Label htmlFor="save-to-db" className="text-sm font-normal cursor-pointer">
                            ذخیره خودکار در دیتابیس (اگر خالی باشد، فقط نمایش داده می‌شود - سریع‌تر)
                        </Label>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !prompt.trim() || !selectedProvider}
                        className="w-full"
                        size="lg"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                در حال تولید تصویر...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                تولید تصویر
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {(generatedMedia || generatedImageUrl) && (
                <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                                <ImageIcon className="w-5 h-5 stroke-indigo-600" />
                            </div>
                            تصویر تولید شده
                            {!saveToDb && generatedImageUrl && (
                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                    (ذخیره نشده)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                            {generatedMedia ? (
                                <MediaImage
                                    media={generatedMedia}
                                    alt={generatedMedia.alt_text || generatedMedia.title || 'تصویر تولید شده'}
                                    className="object-cover"
                                    fill
                                />
                            ) : generatedImageUrl ? (
                                <img
                                    src={generatedImageUrl}
                                    alt={prompt || 'تصویر تولید شده'}
                                    className="w-full h-full object-cover"
                                />
                            ) : null}
                        </div>
                        <div className="flex gap-2">
                            {generatedMedia ? (
                                <>
                                    <Button
                                        onClick={handleSelect}
                                        className="flex-1"
                                        variant="default"
                                    >
                                        انتخاب این تصویر
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                    >
                                        تولید جدید
                                    </Button>
                                </>
                            ) : generatedImageUrl ? (
                                <>
                                    <Button
                                        onClick={handleSaveToDb}
                                        className="flex-1"
                                        variant="default"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        ذخیره در دیتابیس
                                    </Button>
                                    <Button
                                        onClick={handleSelect}
                                        className="flex-1"
                                        variant="secondary"
                                        disabled
                                    >
                                        انتخاب (ابتدا ذخیره کنید)
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                    >
                                        تولید جدید
                                    </Button>
                                </>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

