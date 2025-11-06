"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';
import { Switch } from '@/components/elements/Switch';
import { Badge } from '@/components/elements/Badge';
import { aiApi } from '@/api/ai/route';
import { Loader2, CheckCircle2, XCircle, Sparkles, Eye, EyeOff, ArrowRight, Settings as SettingsIcon } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';
import { msg } from '@/core/messages/message';

interface AIProvider {
    id: number;
    provider_name: string;
    provider_display: string;
    has_api_key: boolean;
    is_active: boolean;
    can_generate: boolean;
    usage_count: number;
    last_used_at: string | null;
}

const getProviderIcon = (provider: AIProvider) => {
    const name = provider.provider_name.toLowerCase();
    if (name.includes('gemini')) return '🔵';
    if (name.includes('openai') || name.includes('dall-e') || name.includes('dalle')) return '🤖';
    if (name.includes('deepseek')) return '🔷';
    if (name.includes('hugging')) return '🤗';
    return '✨';
};

const getProviderDescription = (provider: AIProvider): string => {
    const descMap: Record<string, string> = {
        'gemini': 'مدل هوش مصنوعی Google برای تولید تصاویر با کیفیت بالا',
        'openai': 'مدل پیشرفته OpenAI برای تولید تصاویر واقع‌گرایانه',
        'deepseek': 'مدل DeepSeek برای تولید تصاویر با الگوریتم‌های پیشرفته',
        'huggingface': 'مدل Hugging Face برای تولید تصاویر متنوع و خلاقانه',
        'dall-e': 'مدل پیشرفته OpenAI برای تولید تصاویر واقع‌گرایانه',
    };
    
    const key = provider.provider_name.toLowerCase();
    return descMap[key] || 'مدل هوش مصنوعی برای تولید تصاویر';
};

export function AIProviderSettings() {
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProvider, setEditingProvider] = useState<number | null>(null);
    const [apiKeys, setApiKeys] = useState<Record<number, string>>({});
    const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});
    const [saving, setSaving] = useState<Record<number, boolean>>({});

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            setLoading(true);
            const response = await aiApi.image.getProviders();
            if (response.metaData.status === 'success') {
                // Handle different response formats
                let providersData: AIProvider[] = [];
                
                if (Array.isArray(response.data)) {
                    providersData = response.data;
                } else if (response.data && typeof response.data === 'object') {
                    const dataObj = response.data as any;
                    if ('results' in dataObj && Array.isArray(dataObj.results)) {
                        // Paginated response
                        providersData = dataObj.results;
                    } else if ('data' in dataObj && Array.isArray(dataObj.data)) {
                        // Nested data
                        providersData = dataObj.data;
                    }
                }
                
                setProviders(providersData);
            }
        } catch (error) {
            // Toast already shown by aiApi
        } finally {
            setLoading(false);
        }
    };

    const handleEditProvider = (provider: AIProvider) => {
        setEditingProvider(provider.id);
        setApiKeys(prev => ({ ...prev, [provider.id]: '' }));
    };

    const handleSaveProvider = async (providerId: number | null, providerName: string) => {
        const apiKey = providerId !== null ? apiKeys[providerId] : '';
        if (!apiKey || !apiKey.trim()) {
            toast.error(msg.ai('enterApiKey'));
            return;
        }

        try {
            if (providerId !== null) {
                setSaving(prev => ({ ...prev, [providerId]: true }));
            }
            
            const response = await aiApi.image.saveProvider({
                ...(providerId !== null ? { id: providerId } : {}),
                provider_name: providerName,
                api_key: apiKey.trim(),
                is_active: true,
            });

            if (response.metaData.status === 'success') {
                // پیام از metaData (از سرور می‌آید)
                const responseMsg = response.metaData.message || msg.ai('operationSuccess');
                const savedProvider = response.data;
                if (savedProvider?.is_active) {
                    toast.success(responseMsg);
                } else {
                    toast.warning(responseMsg);
                }
                setEditingProvider(null);
                setApiKeys(prev => {
                    const newKeys = { ...prev };
                    if (providerId !== null) {
                        delete newKeys[providerId];
                    }
                    return newKeys;
                });
                fetchProviders();
            }
        } catch (error: any) {
            // Toast already shown by aiApi
        } finally {
            if (providerId !== null) {
                setSaving(prev => ({ ...prev, [providerId]: false }));
            }
        }
    };

    const handleToggleProvider = async (providerId: number, currentStatus: boolean) => {
        try {
            const response = await aiApi.image.toggleProvider(providerId, !currentStatus);
            if (response.metaData.status === 'success') {
                const msg = response.metaData.message || `Provider ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`;
                toast.success(msg);
                fetchProviders();
            }
        } catch (error: any) {
            // Toast already shown by aiApi
        }
    };

    const toggleShowApiKey = (providerId: number) => {
        setShowApiKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => {
                    const isActive = provider.has_api_key && provider.is_active;
                    const isEditing = editingProvider === provider.id;
                    
                    return (
                        <Card 
                            key={provider.id}
                            className="relative transition-all duration-300 hover:shadow-lg"
                        >
                            <ArrowRight className={`
                                absolute top-3 left-3 w-4 h-4 transition-opacity
                                ${isActive ? 'opacity-100 text-primary' : 'opacity-30'}
                            `} />
                            
                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`
                                        text-2xl flex-shrink-0
                                        ${isActive ? 'scale-110' : ''}
                                        transition-transform
                                    `}>
                                        {getProviderIcon(provider)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base mb-1">
                                            {provider.provider_display}
                                        </CardTitle>
                                        <CardDescription className="text-xs line-clamp-2">
                                            {getProviderDescription(provider)}
                                        </CardDescription>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <div className="flex items-center gap-2">
                                        {isActive && (
                                            <Badge variant="default" className="bg-green-500 text-xs">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                فعال
                                            </Badge>
                                        )}
                                        {provider.has_api_key && !provider.is_active && (
                                            <Badge variant="gray" className="text-xs">
                                                غیرفعال
                                            </Badge>
                                        )}
                                        {!provider.has_api_key && (
                                            <Badge variant="outline" className="text-xs">
                                                بدون API Key
                                            </Badge>
                                        )}
                                    </div>
                                    {isActive && (
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor={`api-key-${provider.id}`} className="text-sm">API Key</Label>
                                            <div className="relative">
                                                <Input
                                                    id={`api-key-${provider.id}`}
                                                    type={showApiKeys[provider.id] ? 'text' : 'password'}
                                                    placeholder="API key را وارد کنید"
                                                    value={apiKeys[provider.id] || ''}
                                                    onChange={(e) => setApiKeys(prev => ({
                                                        ...prev,
                                                        [provider.id]: e.target.value
                                                    }))}
                                                    className="pl-10 text-sm h-9"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowApiKey(provider.id)}
                                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showApiKeys[provider.id] ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleSaveProvider(provider.id, provider.provider_name)}
                                                disabled={saving[provider.id] || !apiKeys[provider.id]?.trim()}
                                                className="flex-1 text-sm h-9"
                                                size="sm"
                                            >
                                                {saving[provider.id] && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                                                ذخیره
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingProvider(null);
                                                    setApiKeys(prev => {
                                                        const newKeys = { ...prev };
                                                        delete newKeys[provider.id];
                                                        return newKeys;
                                                    });
                                                }}
                                                disabled={saving[provider.id]}
                                                className="text-sm h-9"
                                                size="sm"
                                            >
                                                لغو
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {provider.has_api_key && (
                                            <div className="flex items-center justify-between py-2">
                                                <Label className="text-sm">وضعیت:</Label>
                                                <Switch
                                                    checked={provider.is_active}
                                                    onCheckedChange={() => handleToggleProvider(provider.id, provider.is_active)}
                                                    disabled={!provider.has_api_key}
                                                />
                                            </div>
                                        )}
                                        {provider.has_api_key && (
                                            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                                                <div>تعداد استفاده: <strong>{provider.usage_count}</strong> بار</div>
                                            </div>
                                        )}
                                        <Button
                                            variant={provider.has_api_key ? "outline" : "default"}
                                            onClick={() => handleEditProvider(provider)}
                                            className="w-full text-sm h-9"
                                            size="sm"
                                        >
                                            <SettingsIcon className="h-3 w-3 ml-2" />
                                            {provider.has_api_key ? 'تغییر API Key' : 'وارد کردن API Key'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

