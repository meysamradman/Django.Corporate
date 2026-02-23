import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/elements/Skeleton';
import { aiApi } from '@/api/ai/ai';
import { mediaApi } from '@/api/media/media';
import type { Media } from '@/types/shared/media';
import { showSuccess, showError } from '@/core/toast';
import { getCrud } from '@/core/messages/ui';
import { getError } from '@/core/messages/errors';
import { getValidation } from '@/core/messages/validation';
import { AudioInputForm } from './AudioInputForm';
import { GeneratedAudioDisplay } from './GeneratedAudioDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/elements/Button';
import { Settings, Mic } from 'lucide-react';
import type { AvailableProvider } from '@/types/ai/ai';

import { useAuth } from '@/core/auth/AuthContext';

interface AIAudioGeneratorProps {
    onAudioGenerated?: (media: Media) => void;
    onSelectGenerated?: (media: Media) => void;
    onNavigateToSettings?: () => void;
    compact?: boolean;
}

export function AIAudioGenerator({
    onAudioGenerated,
    onSelectGenerated,
    onNavigateToSettings,
    compact = false
}: AIAudioGeneratorProps) {
    const { user } = useAuth();
    const [supportedProviders, setSupportedProviders] = useState<AvailableProvider[]>([]);
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [text, setText] = useState('');
    const [voice, setVoice] = useState('alloy');
    const [speed, setSpeed] = useState(1.0);
    const [saveToDb, setSaveToDb] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedMedia, setGeneratedMedia] = useState<Media | null>(null);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

    const providersFetched = useRef(false);

    useEffect(() => {
        if (!user) {
            setLoadingProviders(true);
            return;
        }

        if (user && !providersFetched.current) {
            const permissionsObject = user?.permissions as any;
            const permissionsArray = (permissionsObject?.permissions || []) as string[];

            const hasAIPermission = permissionsArray.some((p: string) =>
                p === 'all' || p === 'ai.manage' || p === 'ai.audio.manage' || p.startsWith('ai.')
            );

            if (hasAIPermission) {
                providersFetched.current = true;
                fetchAvailableProviders();
            } else {
                setLoadingProviders(false);
            }
        }
    }, [user]);

    const fetchAvailableProviders = async () => {
        try {
            setLoadingProviders(true);
            const [response, activeResponse] = await Promise.all([
                 aiApi.audio.getAvailableProviders(),
                 aiApi.models.getActiveCapabilities().catch(() => ({ data: null }))
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

                setSupportedProviders(providersData as AvailableProvider[]);

                const accessibleProviders = (providersData as AvailableProvider[]).filter((p: AvailableProvider) =>
                    p.can_generate === true
                );

                setAvailableProviders(accessibleProviders);

                if (!selectedProvider && accessibleProviders.length > 0) {
                    const activeSlug = (activeResponse as any)?.data?.audio?.provider_slug;
                    const activeProvider = activeSlug 
                        ? accessibleProviders.find(p => (p.slug === activeSlug || p.provider_name === activeSlug))
                        : null;

                    if (activeProvider) {
                         setSelectedProvider(activeProvider.slug || activeProvider.provider_name || '');
                    } else {
                        const first = accessibleProviders[0] as any;
                        setSelectedProvider(first.provider_name || first.slug || '');
                    }
                }
            }
        } catch (error) {
            showError(error);
            setSupportedProviders([]);
            setAvailableProviders([]);
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProvider) {
            showError(getValidation('required', { field: 'Provider' }));
            return;
        }

        if (!text.trim()) {
            showError(getValidation('required', { field: 'متن' }));
            return;
        }

        if (text.length > 4096) {
            showError(getValidation('maxLength', { field: 'متن', max: 4096 }));
            return;
        }

        try {
            setGenerating(true);
            setGeneratedMedia(null);
            setGeneratedAudioUrl(null);

            const response = await aiApi.audio.generateAudio({
                provider_name: selectedProvider,
                text: text.trim(),
                voice,
                speed,
                response_format: 'mp3',
                save_to_db: saveToDb,
            });

            if (response.metaData.status === 'success') {
                const data = response.data as any;

                if (data.saved === false && data.audio_data_url) {
                    setGeneratedAudioUrl(data.audio_data_url);
                    setGeneratedMedia(null);
                    showSuccess(getCrud('created', { item: 'پادکست' }));
                } else {
                    setGeneratedMedia(data as Media);
                    setGeneratedAudioUrl(null);
                    showSuccess(getCrud('saved', { item: 'پادکست' }));
                    onAudioGenerated?.(data as Media);
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
        setText('');
        setGeneratedMedia(null);
        setGeneratedAudioUrl(null);
    };

    const handleSaveToDb = async () => {
        if (!generatedAudioUrl) return;

        try {
            const response = await fetch(generatedAudioUrl);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append('file', blob, `ai_generated_${Date.now()}.mp3`);
            formData.append('title', text.substring(0, 100));

            const uploadResponse = await mediaApi.uploadMedia(formData);

            if (uploadResponse.metaData.status === 'success') {
                const media = uploadResponse.data;
                setGeneratedMedia(media);
                setGeneratedAudioUrl(null);
                showSuccess(getCrud('saved', { item: 'فایل صوتی' }));
                onAudioGenerated?.(media);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
            const errorText = `${getError('serverError')}: ${errorMessage}`;
            showError(errorText);
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
        if (supportedProviders.length > 0) {
            return (
                <EmptyState
                    title="برای تولید پادکست به کلید API دسترسی ندارید"
                    description="یک Provider سازگار با پادکست وجود دارد، اما برای این ادمین کلید API تنظیم نشده یا دسترسی به Shared API فعال نیست. لطفاً در تنظیمات AI کلید را تنظیم کنید یا Shared را فعال کنید."
                    icon={Mic}
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
            <EmptyState
                title="هیچ مدل AI فعالی برای تولید پادکست وجود ندارد"
                description="برای تولید پادکست با AI، باید یکی از سرویس‌دهنده‌ها را در تنظیمات فعال کنید"
                icon={Mic}
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
            <AudioInputForm
                providers={availableProviders}
                selectedProvider={selectedProvider}
                text={text}
                voice={voice}
                speed={speed}
                saveToDb={saveToDb}
                generating={generating}
                loadingProviders={loadingProviders}
                onSelectProvider={setSelectedProvider}
                onTextChange={setText}
                onVoiceChange={setVoice}
                onSpeedChange={setSpeed}
                onSaveToDbChange={setSaveToDb}
                onGenerate={handleGenerate}
                compact={compact}
            />

            <GeneratedAudioDisplay
                generatedMedia={generatedMedia}
                generatedAudioUrl={generatedAudioUrl}
                text={text}
                saveToDb={saveToDb}
                onSaveToDb={handleSaveToDb}
                onSelect={handleSelect}
                onReset={handleReset}
            />
        </div>
    );
}

