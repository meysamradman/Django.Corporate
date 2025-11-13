"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/elements/Card';
import { Skeleton } from '@/components/elements/Skeleton';
import { aiApi } from '@/api/ai/route';
import { AvailableProvider, AIContentGenerationResponse } from '@/types/ai/ai';
import { toast } from '@/components/elements/Sonner';
import { msg } from '@/core/messages/message';
import { ContentInputForm } from './ContentInputForm';
import { SEOInfoCard } from './SEOInfoCard';
import { ContentDisplay } from './ContentDisplay';
import { EmptyProvidersCard } from './EmptyProvidersCard';

interface AIContentGeneratorProps {
    onNavigateToSettings?: () => void;
}

const sampleContent: AIContentGenerationResponse = {
    title: "راهنمای جامع تولید محتوا با هوش مصنوعی",
    meta_title: "تولید محتوا با هوش مصنوعی | راهنمای جامع 2024",
    meta_description: "آموزش کامل تولید محتوای SEO با استفاده از هوش مصنوعی. یاد بگیرید چگونه با AI محتوای حرفه‌ای و بهینه برای موتورهای جستجو تولید کنید.",
    slug: "ai-content-generation-guide",
    h1: "راهنمای جامع تولید محتوا با هوش مصنوعی",
    content: `
        <p>تولید محتوا با هوش مصنوعی یکی از جدیدترین و کارآمدترین روش‌های ایجاد محتوای دیجیتال در دنیای امروز است. در این مقاله به بررسی کامل این موضوع می‌پردازیم.</p>
        
        <h2>مزایای تولید محتوا با AI</h2>
        <p>استفاده از هوش مصنوعی برای تولید محتوا مزایای زیادی دارد که مهم‌ترین آن‌ها عبارتند از:</p>
        <ul>
            <li>سرعت بالا در تولید محتوا</li>
            <li>هزینه کمتر نسبت به تولید دستی</li>
            <li>قابلیت تولید محتوای زیاد در زمان کوتاه</li>
            <li>بهینه‌سازی برای موتورهای جستجو</li>
        </ul>
        
        <h2>نحوه استفاده از AI برای تولید محتوا</h2>
        <p>برای استفاده از هوش مصنوعی در تولید محتوا، باید مراحل زیر را دنبال کنید:</p>
        <ol>
            <li>انتخاب ابزار مناسب</li>
            <li>تعریف موضوع و کلمات کلیدی</li>
            <li>تنظیم پارامترهای تولید محتوا</li>
            <li>بازبینی و ویرایش محتوا</li>
        </ol>
        
        <h3>نتیجه‌گیری</h3>
        <p>تولید محتوا با هوش مصنوعی می‌تواند به شما کمک کند تا محتوای با کیفیت و بهینه برای وب‌سایت خود تولید کنید. با استفاده از این تکنولوژی می‌توانید زمان و هزینه خود را به طور قابل توجهی کاهش دهید.</p>
    `,
    keywords: ["هوش مصنوعی", "تولید محتوا", "SEO", "محتوا", "AI"],
    word_count: 350,
    provider_name: "deepseek",
    generation_time_ms: 2500,
};

export function AIContentGenerator({ onNavigateToSettings }: AIContentGeneratorProps) {
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [topic, setTopic] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<AIContentGenerationResponse | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isSample, setIsSample] = useState(false);

    useEffect(() => {
        fetchAvailableProviders();
    }, []);

    useEffect(() => {
        if (!loadingProviders && availableProviders.length > 0 && !generatedContent && !isSample) {
            setGeneratedContent(sampleContent);
            setIsSample(true);
        }
    }, [loadingProviders, availableProviders.length, generatedContent, isSample]);

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
            // Toast already shown by aiApi
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProvider) {
            toast.error(msg.ai('selectModel'));
            return;
        }

        if (!topic.trim()) {
            toast.error(msg.ai('enterTopic'));
            return;
        }

        try {
            setGenerating(true);
            setIsSample(false);
            setGeneratedContent(null);

            const response = await aiApi.content.generateContent({
                provider_name: selectedProvider,
                topic: topic.trim(),
            });

            if (response.metaData.status === 'success') {
                setGeneratedContent(response.data);
                setIsSample(false);
                toast.success(msg.ai('contentGenerated'));
            }
        } catch (error: any) {
            // Toast already shown by aiApi
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            toast.success(msg.ai('copied'));
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            toast.error(msg.ai('copyError'));
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
        return <EmptyProvidersCard onNavigateToSettings={onNavigateToSettings} />;
    }

    return (
        <div className="space-y-6">
            <ContentInputForm
                providers={availableProviders}
                selectedProvider={selectedProvider}
                topic={topic}
                generating={generating}
                loadingProviders={loadingProviders}
                onSelectProvider={setSelectedProvider}
                onTopicChange={setTopic}
                onGenerate={handleGenerate}
            />

            {generatedContent && (
                <div className="space-y-4">
                    {isSample && (
                        <div className="mb-4 p-4 bg-yellow/10 border border-yellow-1 rounded-lg">
                            <p className="text-sm text-font-s">
                                این یک نمونه محتوا است برای نمایش استایل. برای تولید محتوای واقعی، موضوع خود را وارد کرده و دکمه تولید را بزنید.
                            </p>
                        </div>
                    )}
                    <SEOInfoCard
                        content={generatedContent}
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                    />
                    <ContentDisplay
                        content={generatedContent}
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                    />
                </div>
            )}
        </div>
    );
}

