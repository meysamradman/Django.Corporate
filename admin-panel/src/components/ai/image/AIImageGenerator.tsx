import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/elements/Skeleton';
import { aiApi } from '@/api/ai/ai';
import type { AvailableProvider } from '@/types/ai/ai';
import { mediaApi } from '@/api/media/media';
import type { Media } from '@/types/shared/media';
import { showSuccess, showError } from '@/core/toast';
import { msg } from '@/core/messages';
import { ImageInputForm } from './ImageInputForm';
import { GeneratedImageDisplay } from './GeneratedImageDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/elements/Button';
import { Settings, Wand2 } from 'lucide-react';

import { useAuth } from '@/core/auth/AuthContext';

interface AIImageGeneratorProps {
    onImageGenerated?: (media: Media) => void;
    onSelectGenerated?: (media: Media) => void;
    onNavigateToSettings?: () => void;
    compact?: boolean;
}

export function AIImageGenerator({ onImageGenerated, onSelectGenerated, onNavigateToSettings, compact = false }: AIImageGeneratorProps) {
    const { user } = useAuth();
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const size = '1024x1024';
    const quality = 'standard';
    const [saveToDb, setSaveToDb] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedMedia, setGeneratedMedia] = useState<Media | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    const providersFetched = useRef(false);

    useEffect(() => {
        if (user && !providersFetched.current) {
            const permissionsObject = user?.permissions as any;
            const permissionsArray = (permissionsObject?.permissions || []) as string[];

            const hasAIPermission = permissionsArray.some((p: string) =>
                p === 'all' || p === 'ai.manage' || p.startsWith('ai.')
            );

            if (hasAIPermission) {
                providersFetched.current = true;
                fetchAvailableProviders();
            } else {
                setLoadingProviders(false);
            }
        } else if (!user) {
            setLoadingProviders(true);
        }
    }, [user]);

    const fetchAvailableProviders = async () => {
        try {
            setLoadingProviders(true);
            
            // Fetch both available and active to set smart default
            const [response, activeResponse] = await Promise.all([
                aiApi.image.getAvailableProviders('image'),
                aiApi.models.getActiveCapabilities().catch(() => ({ data: null })) // Fail gracefully
            ]);

            if (response.metaData.status === 'success') {
                let providersData: any[] = [];

                if (Array.isArray(response.data)) {
                    providersData = response.data;
                } else if (response.data && typeof response.data === 'object') {
                    const dataObj = response.data as any;
                    if ('data' in dataObj && Array.isArray(dataObj.data)) {
                        providersData = dataObj.data;
                    }
                }

                const providers = providersData.filter((p: AvailableProvider) =>
                    p.can_generate === true
                );

                setAvailableProviders(providers);

                if (!selectedProvider && providers.length > 0) {
                    // Try to match active capability first
                    const activeSlug = (activeResponse as any)?.data?.image?.provider_slug;
                    const activeProvider = activeSlug 
                        ? providers.find(p => p.slug === activeSlug || p.provider_name === activeSlug)
                        : null;

                    if (activeProvider) {
                        setSelectedProvider(activeProvider.slug || activeProvider.provider_name || '');
                    } else {
                        setSelectedProvider((providers[0] as any)?.provider_name || (providers[0] as any)?.slug || '');
                    }
                }
            }
        } catch {
            setAvailableProviders([]);
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProvider) {
            showError(msg.ai('selectModel'));
            return;
        }

        if (!prompt.trim()) {
            showError(msg.ai('enterPrompt'));
            return;
        }

        try {
            setGenerating(true);
            setGeneratedMedia(null);
            setGeneratedImageUrl(null);

            const response = await aiApi.image.generateImage({
                provider_name: selectedProvider,
                prompt: prompt.trim(),
                size,
                quality,
                save_to_media: saveToDb,
                model: selectedModel || undefined,
            });

            if (response.metaData.status === 'success') {
                const data = response.data as any;

                if ((data as any).saved === false && (data as any).image_data_url) {
                    setGeneratedImageUrl((data as any).image_data_url);
                    setGeneratedMedia(null);
                    showSuccess(msg.ai('imageGenerated'));
                } else {
                    setGeneratedMedia(data as Media);
                    setGeneratedImageUrl(null);
                    showSuccess(msg.ai('imageGeneratedAndSaved'));
                    onImageGenerated?.(data as Media);
                }

            }
        } catch (error) {
            showError(error);
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

        try {
            const response = await fetch(generatedImageUrl);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append('file', blob, `ai_generated_${Date.now()}.png`);
            formData.append('title', prompt.substring(0, 100));
            formData.append('alt_text', prompt.substring(0, 200));

            const uploadResponse = await mediaApi.uploadMedia(formData);

            if (uploadResponse.metaData.status === 'success') {
                const media = uploadResponse.data;
                setGeneratedMedia(media);
                setGeneratedImageUrl(null);
                showSuccess(msg.ai('imageSaved'));
                onImageGenerated?.(media);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
            showError(msg.ai('saveImageError') + ': ' + errorMessage);
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
            <EmptyState
                title="هیچ مدل AI فعالی برای تولید تصویر وجود ندارد"
                description="برای تولید تصویر با AI، باید یکی از سرویس‌دهنده‌ها را در تنظیمات فعال کنید"
                icon={Wand2}
                size="md"
                action={
                    onNavigateToSettings && (
                        <Button
                            onClick={onNavigateToSettings}
                            variant="default"
                            className="gap-2"
                        >
                            <Settings className="h-4 w-4" />
                            رفتن به تنظیمات AI
                        </Button>
                    )
                }
            />
        );
    }

    return (
        <div className={compact ? "space-y-3" : "space-y-6"}>
            <ImageInputForm
                providers={availableProviders}
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
                prompt={prompt}
                saveToDb={saveToDb}
                generating={generating}
                loadingProviders={loadingProviders}
                onSelectProvider={(val) => {
                    setSelectedProvider(val);
                    setSelectedModel(null);
                }}
                onSelectModel={setSelectedModel}
                onPromptChange={setPrompt}
                onSaveToDbChange={setSaveToDb}
                onGenerate={handleGenerate}
                compact={compact}
            />

            <GeneratedImageDisplay
                generatedMedia={generatedMedia}
                generatedImageUrl={generatedImageUrl}
                prompt={prompt}
                saveToDb={saveToDb}
                onSaveToDb={handleSaveToDb}
                onSelect={handleSelect}
                onReset={handleReset}
            />
        </div>
    );
}

