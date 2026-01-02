import { useState, useMemo, useEffect, useCallback, lazy, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { MessageSquare, Image, Music, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import { Skeleton } from '@/components/elements/Skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/elements/Dialog';
import { ProviderCard } from '@/components/ai/models/components/ProviderCard';
import { getProviderMetadata, BACKEND_TO_FRONTEND_ID } from '@/components/ai/settings/config/providerConfig';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/ai';
import { api } from '@/core/config/api';
import { useUserPermissions } from '@/core/permissions';
import { useAuth } from '@/core/auth/AuthContext';
import { showError, showSuccess } from '@/core/toast';

const OpenRouterModelSelectorContent = lazy(() => import('@/components/ai/settings/OpenRouterModelSelector').then(mod => ({ default: mod.OpenRouterModelSelectorContent })));
const HuggingFaceModelSelectorContent = lazy(() => import('@/components/ai/settings/HuggingFaceModelSelector').then(mod => ({ default: mod.HuggingFaceModelSelectorContent })));
const OpenAIModelSelectorContent = lazy(() => import('@/components/ai/settings/OpenAIModelSelector').then(mod => ({ default: mod.OpenAIModelSelectorContent })));
const GoogleGeminiModelSelectorContent = lazy(() => import('@/components/ai/settings/GoogleGeminiModelSelector').then(mod => ({ default: mod.GoogleGeminiModelSelectorContent })));
const DeepSeekModelSelectorContent = lazy(() => import('@/components/ai/settings/DeepSeekModelSelector').then(mod => ({ default: mod.DeepSeekModelSelectorContent })));
const GroqModelSelectorContent = lazy(() => import('@/components/ai/settings/GroqModelSelector').then(mod => ({ default: mod.GroqModelSelectorContent })));

type Capability = 'chat' | 'content' | 'image' | 'audio';

const CAPABILITY_CONFIG: Record<Capability, { label: string; icon: ElementType; description: string }> = {
    chat: {
        label: 'چت',
        icon: MessageSquare,
        description: 'مدل‌های مناسب برای گفتگو و مکالمه',
    },
    content: {
        label: 'محتوا',
        icon: FileText,
        description: 'مدل‌های مناسب برای تولید محتوا (مقاله، پست، و غیره)',
    },
    image: {
        label: 'تصویر',
        icon: Image,
        description: 'مدل‌های مناسب برای تولید تصویر',
    },
    audio: {
        label: 'صدا / پادکست',
        icon: Music,
        description: 'مدل‌های مناسب برای تولید و تبدیل صدا',
    },
};

export default function AIModelsPage() {
    const navigate = useNavigate();
    const { isLoading: isAuthLoading } = useAuth();
    const { isSuperAdmin, hasPermission } = useUserPermissions();

    const hasAccess = 
        isSuperAdmin || 
        hasPermission('ai.manage') || 
        hasPermission('ai.chat.manage') || 
        hasPermission('ai.content.manage') || 
        hasPermission('ai.image.manage') || 
        hasPermission('ai.audio.manage');

    const [activeTab, setActiveTab] = useState<Capability>('chat');
    const [showOpenRouterModal, setShowOpenRouterModal] = useState(false);
    const [showHuggingFaceModal, setShowHuggingFaceModal] = useState(false);
    const [showOpenAIModal, setShowOpenAIModal] = useState(false);
    const [showGeminiModal, setShowGeminiModal] = useState(false);
    const [showDeepSeekModal, setShowDeepSeekModal] = useState(false);
    const [showGroqModal, setShowGroqModal] = useState(false);

    const { data: providers } = useQuery({
        queryKey: ['ai-providers'],
        queryFn: async () => {
            const response = await aiApi.providers.getAll();
            return response.data || [];
        },
        staleTime: 0,
        gcTime: 0,
    });

    const getProviderIdBySlug = (slug: string) => {
        const provider = providers?.find((p: any) => p.slug === slug);
        return provider?.id?.toString() || '1';
    };

    const { data: availableProviders } = useQuery({
        queryKey: ['ai-available-providers', activeTab],
        queryFn: async () => {
            try {
                const endpoint = `/admin/ai-providers/available/?capability=${activeTab}`;
                const response = await api.get<any[]>(endpoint);
                if (response.metaData.status === 'success' && response.data) {
                    return Array.isArray(response.data) ? response.data : [];
                }
                return [];
            } catch (error: any) {
                return [];
            }
        },
        staleTime: 0,
        gcTime: 0,
    });

    const normalizeProviderSlug = useCallback((backendName: string): string => {
        const name = backendName.toLowerCase().trim();
        
        if (BACKEND_TO_FRONTEND_ID[name]) {
            return BACKEND_TO_FRONTEND_ID[name];
        }
        
        if (name.includes('openrouter')) return 'openrouter';
        if (name.includes('huggingface') || name.includes('hugging')) return 'huggingface';
        if (name.includes('openai')) return 'openai';
        if (name.includes('gemini') || name.includes('google')) return 'gemini';
        if (name.includes('deepseek')) return 'deepseek';
        if (name.includes('groq')) return 'groq';
        
        return name;
    }, []);

    const availableProvidersMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        if (availableProviders) {
            availableProviders.forEach((p: any) => {
                const backendName = p.provider_name || p.slug || '';
                const slug = normalizeProviderSlug(backendName);
                if (slug) {
                    map[slug] = true;
                }
            });
        }
        return map;
    }, [availableProviders, normalizeProviderSlug]);

    const { data: activeModels, isLoading: isLoadingActiveModels } = useQuery({
        queryKey: ['ai-active-models', activeTab],
        queryFn: async () => {
            const providers = availableProviders 
                ? availableProviders.map((p: any) => p.provider_name || p.slug).filter(Boolean)
                : [];
            
            const results: Record<string, any> = {};

            await Promise.all(
                providers.map(async (provider: string) => {
                    try {
                        const response = await aiApi.models.getActiveModel(provider, activeTab);
                        
                        if (response.data && response.data.model_id) {
                            const modelCapabilities = response.data.capabilities || [];
                            if (modelCapabilities.includes(activeTab)) {
                                const providerKey = normalizeProviderSlug(provider);
                                results[providerKey] = response.data;
                            }
                        }
                    } catch (error: any) {
                    }
                })
            );

            return results;
        },
        enabled: !!activeTab && !!availableProviders,
        staleTime: 0,
        gcTime: 0,
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isAuthLoading && !hasAccess) {
            showError('این صفحه فقط برای سوپر ادمین‌ها قابل دسترسی است');
            navigate('/ai/settings', { replace: true });
        }
    }, [isAuthLoading, hasAccess, navigate]);

    const handleModelSaved = async () => {
        queryClient.invalidateQueries({ queryKey: ['ai-active-models', activeTab] });
        
        showSuccess('مدل با موفقیت فعال شد');
        
        setShowOpenRouterModal(false);
        setShowHuggingFaceModal(false);
        setShowOpenAIModal(false);
        setShowGeminiModal(false);
        setShowDeepSeekModal(false);
        setShowGroqModal(false);
    };

    return (
        <div className="space-y-6" suppressHydrationWarning>
            <PageHeader title="انتخاب و مدیریت مدل‌های AI" />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Capability)} suppressHydrationWarning>
                <TabsList className="grid w-full grid-cols-4">
                    {Object.entries(CAPABILITY_CONFIG).map(([key, config]) => {
                        const TabIcon = config.icon;
                        return (
                            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                                <TabIcon className="w-4 h-4" />
                                {config.label}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {Object.entries(CAPABILITY_CONFIG).map(([key, config]) => {
                    const TabIcon = config.icon;
                    return (
                        <TabsContent key={`${key}-${activeTab}`} value={key}>
                            <Card className="shadow-sm border hover:shadow-lg transition-all duration-300">
                                <CardHeader className="border-b">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2 bg-pink rounded-lg">
                                            <TabIcon className="w-5 h-5 text-pink-2" />
                                        </div>
                                        <div>
                                            <div>{config.label}</div>
                                            <p className="text-sm font-normal text-font-s mt-1">
                                                {config.description}
                                            </p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingActiveModels ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                                <Skeleton key={i} className="h-32 w-full rounded-lg" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {availableProviders && availableProviders.length > 0 ? (
                                                availableProviders.map((provider: any) => {
                                                    const backendName = provider.provider_name || provider.slug || '';
                                                    const providerSlug = normalizeProviderSlug(backendName);
                                                    
                                                    const metadata = getProviderMetadata(providerSlug);
                                                    
                                                    const providerName = metadata?.name || provider.provider_name || provider.slug || 'نامشخص';
                                                    const description = metadata?.description || provider.description || 'مدل AI';
                                                    
                                                    const getModalHandler = () => {
                                                        if (providerSlug === 'openrouter') return () => setShowOpenRouterModal(true);
                                                        if (providerSlug === 'huggingface') return () => setShowHuggingFaceModal(true);
                                                        if (providerSlug === 'openai') return () => setShowOpenAIModal(true);
                                                        if (providerSlug === 'gemini') return () => setShowGeminiModal(true);
                                                        if (providerSlug === 'deepseek') return () => setShowDeepSeekModal(true);
                                                        if (providerSlug === 'groq') return () => setShowGroqModal(true);
                                                        return () => {};
                                                    };

                                                    return (
                                                        <ProviderCard
                                                            key={providerSlug}
                                                            providerSlug={providerSlug}
                                                            providerName={providerName}
                                                            description={description}
                                                            activeModel={activeModels?.[providerSlug]}
                                                            onSelect={getModalHandler()}
                                                        />
                                                    );
                                                })
                                            ) : (
                                                <div className="col-span-full">
                                                    <Card>
                                                        <CardContent className="p-8 text-center">
                                                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-font-s opacity-50" />
                                                            <p className="text-font-s">
                                                                هیچ Provider فعالی برای {CAPABILITY_CONFIG[activeTab].label} یافت نشد.
                                                            </p>
                                                            <p className="text-xs text-font-s mt-2">
                                                                لطفاً ابتدا Provider را در تنظیمات فعال کنید و API Key خود را تنظیم نمایید.
                                                            </p>
                                                </CardContent>
                                            </Card>
                                                    </div>
                                        )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>

            {availableProvidersMap.openrouter && (
                <Dialog open={showOpenRouterModal} onOpenChange={setShowOpenRouterModal}>
                    <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                            <DialogTitle className="flex items-center gap-3 text-font-p">
                                <span className="text-2xl">🤖</span>
                                انتخاب مدل‌های OpenRouter - {CAPABILITY_CONFIG[activeTab].label}
                            </DialogTitle>
                            <DialogDescription className="text-font-s">
                                انتخاب مدل‌های مورد نظر از 400+ مدل OpenRouter برای {CAPABILITY_CONFIG[activeTab].description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                            <OpenRouterModelSelectorContent
                                providerId="openrouter"
                                providerName="OpenRouter"
                                capability={activeTab}
                                onSave={handleModelSaved}
                                onSelectionChange={() => { }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {availableProvidersMap.huggingface && (
                <Dialog open={showHuggingFaceModal} onOpenChange={setShowHuggingFaceModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">🤖</span>
                            انتخاب مدل‌های Hugging Face - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            انتخاب مدل‌های مورد نظر از هزاران مدل Hugging Face برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <HuggingFaceModelSelectorContent
                            providerId="huggingface"
                            providerName="Hugging Face"
                            capability={activeTab}
                            onSave={handleModelSaved}
                            onSelectionChange={() => { }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
            )}

            {availableProvidersMap.openai && (
                <Dialog open={showOpenAIModal} onOpenChange={setShowOpenAIModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">🤖</span>
                            انتخاب مدل‌های OpenAI - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            مدل‌های OpenAI برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <OpenAIModelSelectorContent
                            providerId={getProviderIdBySlug('openai')}
                            providerName="OpenAI"
                            capability={activeTab}
                            onSave={handleModelSaved}
                        />
                    </div>
                </DialogContent>
            </Dialog>
            )}

            {availableProvidersMap.gemini && (
                <Dialog open={showGeminiModal} onOpenChange={setShowGeminiModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">🤖</span>
                            انتخاب مدل‌های Google Gemini - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            مدل‌های Gemini برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <GoogleGeminiModelSelectorContent
                            providerId={getProviderIdBySlug('gemini')}
                            providerName="Google Gemini"
                            capability={activeTab}
                            onSave={handleModelSaved}
                        />
                    </div>
                </DialogContent>
            </Dialog>
            )}

            {availableProvidersMap.deepseek && (
                <Dialog open={showDeepSeekModal} onOpenChange={setShowDeepSeekModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">🤖</span>
                            انتخاب مدل‌های DeepSeek - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            مدل‌های DeepSeek برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <DeepSeekModelSelectorContent
                            providerId={getProviderIdBySlug('deepseek')}
                            providerName="DeepSeek"
                            capability={activeTab}
                            onSave={handleModelSaved}
                        />
                    </div>
                </DialogContent>
            </Dialog>
            )}

            {availableProvidersMap.groq && (
                <Dialog open={showGroqModal} onOpenChange={setShowGroqModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">🤖</span>
                            انتخاب مدل‌های Groq - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            مدل‌های رایگان Groq برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <GroqModelSelectorContent
                            providerId={getProviderIdBySlug('groq')}
                            providerName="Groq"
                            capability={activeTab}
                            onSave={handleModelSaved}
                        />
                    </div>
                </DialogContent>
            </Dialog>
            )}
        </div>
    );
}
