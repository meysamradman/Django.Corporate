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
import { EmptyProvidersCard } from '../shared';
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
            const response = await aiApi.image.getAvailableProviders('image');
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
                    p.can_generate === true && p.provider_name !== 'gemini'
                );
                    
                setAvailableProviders(providers);
                
                if (selectedProvider && !providers.some(p => p.provider_name === selectedProvider)) {
                    setSelectedProvider('');
                }
            }
        } catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const apiError = error as { response?: { AppStatusCode?: number } };
                if (apiError.response?.AppStatusCode === 404) {
                    setAvailableProviders([]);
                }
            }
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

            const response = await aiApi.image.generateImage({
                provider_name: selectedProvider,
                prompt: prompt.trim(),
                size,
                quality,
                save_to_db: saveToDb,
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
                
                fetchAvailableProviders();
            }
        } catch {
          // Error handling is done by toast
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
        return <EmptyProvidersCard type="image" onNavigateToSettings={onNavigateToSettings} />;
    }

    return (
        <div className={compact ? "space-y-3" : "space-y-6"}>
            <ImageInputForm
                providers={availableProviders}
                selectedProvider={selectedProvider}
                prompt={prompt}
                saveToDb={saveToDb}
                generating={generating}
                loadingProviders={loadingProviders}
                onSelectProvider={setSelectedProvider}
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

