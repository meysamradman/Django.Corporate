import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/elements/Card';
import { Skeleton } from '@/components/elements/Skeleton';
import { aiApi } from '@/api/ai/ai';
import type { AvailableProvider, AIContentGenerationResponse } from '@/types/ai/ai';
import { toast } from '@/components/elements/Sonner';
import { msg } from '@/core/messages';
import { ContentInputForm } from './ContentInputForm';
import { SEOInfoCard } from './SEOInfoCard';
import { ContentDisplay } from './ContentDisplay';
import { EmptyProvidersCard } from '../shared';
import { useAuth } from '@/core/auth/AuthContext';

interface AIContentGeneratorProps {
    onNavigateToSettings?: () => void;
}

export function AIContentGenerator({ onNavigateToSettings }: AIContentGeneratorProps) {
    const { user } = useAuth();
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [topic, setTopic] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<AIContentGenerationResponse | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
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

    useEffect(() => {
    }, [loadingProviders, availableProviders.length, generatedContent]);

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
            if (error?.response?.AppStatusCode === 404) {
                setAvailableProviders([]);
            }
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
            setGeneratedContent(null);

            const response = await aiApi.content.generateContent({
                provider_name: selectedProvider,
                topic: topic.trim(),
            });

            if (response.metaData.status === 'success') {
                setGeneratedContent(response.data);
                toast.success(msg.ai('contentGenerated'));
            }
        } catch (error: any) {
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
        return <EmptyProvidersCard type="content" onNavigateToSettings={onNavigateToSettings} />;
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

