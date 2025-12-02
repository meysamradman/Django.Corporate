"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/elements/Card';
import { Skeleton } from '@/components/elements/Skeleton';
import { aiApi } from '@/api/ai/route';
import { AvailableProvider } from '@/types/ai/ai';
import { mediaApi } from '@/api/media/route';
import { Media } from '@/types/shared/media';
import { toast } from '@/components/elements/Sonner';
import { msg } from '@/core/messages/message';
import { AudioInputForm } from './AudioInputForm';
import { GeneratedAudioDisplay } from './GeneratedAudioDisplay';
import { EmptyProvidersCard } from './EmptyProvidersCard';
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
    const [ttsDefaults, setTtsDefaults] = useState<{
        model?: string;
        voice?: string;
        speed?: number;
        response_format?: string;
    } | null>(null);
    const [saveToDb, setSaveToDb] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedMedia, setGeneratedMedia] = useState<Media | null>(null);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const providersFetched = useRef(false);
    const [isDemoMode, setIsDemoMode] = useState(false);

    useEffect(() => {
        if (user && !providersFetched.current) {
            const hasAIPermission = user?.permissions?.some((p: string) => 
                p === 'all' || p === 'ai.manage' || p === 'ai.audio.manage' || p.startsWith('ai.')
            );
            
            if (hasAIPermission) {
                providersFetched.current = true;
                fetchAvailableProviders();
            } else {
                setLoadingProviders(false);
            }
        } else if (!user) {
            setLoadingProviders(false);
            // Demo mode when not logged in or API not available
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
            const response = await aiApi.audio.getAvailableProviders();
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
                
                // Set TTS defaults from backend if available
                if (providers.length > 0) {
                    const firstProvider = providers[0] as any;
                    if (firstProvider.tts_defaults) {
                        setTtsDefaults(firstProvider.tts_defaults);
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
            toast.error('لطفاً مدل AI را انتخاب کنید');
            return;
        }

        if (!text.trim()) {
            toast.error('لطفاً متن را وارد کنید');
            return;
        }

        if (text.length > 4096) {
            toast.error('متن نمی‌تواند بیشتر از 4096 کاراکتر باشد');
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
                    toast.success('پادکست با موفقیت تولید شد');
                } else {
                    setGeneratedMedia(data as Media);
                    setGeneratedAudioUrl(null);
                    toast.success('پادکست با موفقیت تولید و ذخیره شد');
                    onAudioGenerated?.(data as Media);
                }
                
                fetchAvailableProviders();
            }
        } catch (error: any) {
            // If in demo mode, show sample audio
            if (isDemoMode) {
                setTimeout(() => {
                    setGeneratedAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // Sample audio for demo
                    toast.info('حالت نمایشی: این یک نمونه است. برای استفاده واقعی، API را فعال کنید.');
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
                toast.success('فایل صوتی ذخیره شد');
                onAudioGenerated?.(media);
            }
        } catch (error: any) {
            toast.error('خطا در ذخیره فایل صوتی: ' + (error.message || 'خطای نامشخص'));
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
        return <EmptyProvidersCard onNavigateToSettings={onNavigateToSettings} />;
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

