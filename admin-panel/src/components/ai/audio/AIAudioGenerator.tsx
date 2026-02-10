import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/elements/Skeleton';
import { aiApi } from '@/api/ai/ai';
import type { AvailableProvider } from '@/types/ai/ai';
import { mediaApi } from '@/api/media/media';
import type { Media } from '@/types/shared/media';
import { showSuccess, showError, showInfo } from '@/core/toast';
import { AudioInputForm } from './AudioInputForm';
import { GeneratedAudioDisplay } from './GeneratedAudioDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/elements/Button';
import { Settings, Mic } from 'lucide-react';

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
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [text, setText] = useState('');
    const [model, setModel] = useState('tts-1');
    const [voice, setVoice] = useState('alloy');
    const [speed, setSpeed] = useState(1.0);
    const [saveToDb, setSaveToDb] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedMedia, setGeneratedMedia] = useState<Media | null>(null);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const providersFetched = useRef(false);
    const [isDemoMode, setIsDemoMode] = useState(false);

    console.log('🚀 [AIAudioGenerator] Component Mount/Render. User:', user ? 'Present' : 'Null');

    useEffect(() => {
        console.log('🔄 [AIAudioGenerator] useEffect triggered. User:', user ? 'Present' : 'Null', 'providersFetched:', providersFetched.current);

        if (user && !providersFetched.current) {
            const permissionsObject = user?.permissions as any;
            const permissionsArray = (permissionsObject?.permissions || []) as string[];

            console.log('🔑 [AIAudioGenerator] Permissions:', permissionsArray);

            const hasAIPermission = permissionsArray.some((p: string) =>
                p === 'all' || p === 'ai.manage' || p === 'ai.audio.manage' || p.startsWith('ai.')
            );

            console.log('🛡️ [AIAudioGenerator] hasAIPermission:', hasAIPermission);

            if (hasAIPermission) {
                providersFetched.current = true;
                console.log('⚡ [AIAudioGenerator] Permissions OK. Calling fetchAvailableProviders...');
                fetchAvailableProviders();
            } else {
                console.warn('⛔ [AIAudioGenerator] User does NOT have AI permissions.');
                setLoadingProviders(false);
            }
        } else if (!user) {
            console.log('⏳ [AIAudioGenerator] User not yet loaded. Demo mode...');
            setLoadingProviders(false);
            setIsDemoMode(true);
            setAvailableProviders([{
                id: 1,
                provider_name: 'openai',
                display_name: 'OpenAI',
                is_active: true,
                can_generate: true,
            } as AvailableProvider]);
            setSelectedProvider('openai');
        }
    }, [user]);

    const fetchAvailableProviders = async () => {
        try {
            setLoadingProviders(true);
            console.log('🔍 [AIAudioGenerator] Fetching available providers...');
            const response = await aiApi.audio.getAvailableProviders();
            console.log('📦 [AIAudioGenerator] Response:', response);

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

                console.log('📋 [AIAudioGenerator] Providers data:', providersData);

                const providers = providersData.filter((p: AvailableProvider) =>
                    p.can_generate === true
                );

                console.log('✅ [AIAudioGenerator] Filtered providers:', providers);
                setAvailableProviders(providers);

                if (providers.length > 0) {
                    const firstProvider = providers[0] as any;
                    if (firstProvider.tts_defaults) {
                        setModel(firstProvider.tts_defaults.model || 'tts-1');
                        setVoice(firstProvider.tts_defaults.voice || 'alloy');
                        setSpeed(firstProvider.tts_defaults.speed || 1.0);
                    }
                }

                if (selectedProvider && !providers.some(p => p.provider_name === selectedProvider)) {
                    setSelectedProvider('');
                } else if (providers.length > 0 && !selectedProvider) {
                    setSelectedProvider('openai');
                }
            }
        } catch (error) {
            console.error('❌ [AIAudioGenerator] Error fetching providers:', error);
            setIsDemoMode(true);
            setAvailableProviders([{
                id: 1,
                provider_name: 'openai',
                display_name: 'OpenAI',
                is_active: true,
                can_generate: true,
            } as AvailableProvider]);
            setSelectedProvider('openai');
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProvider) {
            showError('لطفاً مدل AI را انتخاب کنید');
            return;
        }

        if (!text.trim()) {
            showError('لطفاً متن را وارد کنید');
            return;
        }

        if (text.length > 4096) {
            showError('متن نمی‌تواند بیشتر از 4096 کاراکتر باشد');
            return;
        }

        try {
            setGenerating(true);
            setGeneratedMedia(null);
            setGeneratedAudioUrl(null);

            const response = await aiApi.audio.generateAudio({
                provider_name: selectedProvider,
                text: text.trim(),
                model,
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
                    showSuccess('پادکست با موفقیت تولید شد');
                } else {
                    setGeneratedMedia(data as Media);
                    setGeneratedAudioUrl(null);
                    showSuccess('پادکست با موفقیت تولید و ذخیره شد');
                    onAudioGenerated?.(data as Media);
                }

                fetchAvailableProviders();
            }
        } catch {
            if (isDemoMode) {
                setTimeout(() => {
                    setGeneratedAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
                    showInfo('حالت نمایشی: این یک نمونه است. برای استفاده واقعی، API را فعال کنید.');
                    setGenerating(false);
                }, 1500);
            } else {
                setGenerating(false);
            }
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
                showSuccess('فایل صوتی ذخیره شد');
                onAudioGenerated?.(media);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
            showError('خطا در ذخیره فایل صوتی: ' + errorMessage);
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
                model={model}
                voice={voice}
                speed={speed}
                saveToDb={saveToDb}
                generating={generating}
                loadingProviders={loadingProviders}
                onSelectProvider={setSelectedProvider}
                onTextChange={setText}
                onModelChange={setModel}
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

