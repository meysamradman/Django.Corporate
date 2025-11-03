"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';
import { Switch } from '@/components/elements/Switch';
import { Badge } from '@/components/elements/Badge';
import { aiApi } from '@/api/ai/route';
import { Loader2, CheckCircle2, XCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';

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
            console.error('Error fetching providers:', error);
            toast.error('خطا در دریافت لیست Provider ها');
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
            toast.error('لطفاً API key را وارد کنید');
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
                // پیام از metaData
                const msg = response.metaData.message || 'عملیات با موفقیت انجام شد';
                const savedProvider = response.data;
                if (savedProvider?.is_active) {
                    toast.success(msg);
                } else {
                    toast.warning(msg);
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
            const errorMessage = error?.response?.data?.metaData?.message
                || error?.response?.data?.detail
                || error?.response?.data?.errors?.api_key?.[0]
                || 'خطا در ذخیره API key';
            toast.error(errorMessage);
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
            const errorMessage = error?.response?.data?.metaData?.message || error?.response?.data?.detail || 'خطا در تغییر وضعیت Provider';
            toast.error(errorMessage);
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">تنظیمات مدل‌های AI</h3>
                    <p className="text-sm text-muted-foreground">
                        API key مدل‌های مختلف را وارد کنید تا بتوانید تصویر تولید کنید
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                {providers.map((provider) => (
                    <Card key={provider.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <div>
                                        <CardTitle className="text-base">{provider.provider_display}</CardTitle>
                                        <CardDescription>
                                            {provider.has_api_key 
                                                ? `استفاده شده: ${provider.usage_count} بار`
                                                : 'API key وارد نشده است'}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(provider.has_api_key && provider.is_active) && (
                                        <Badge variant="default" className="bg-green-500">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            آماده استفاده
                                        </Badge>
                                    )}
                                    {provider.has_api_key && !provider.is_active && (
                                        <Badge variant="gray">غیرفعال</Badge>
                                    )}
                                    {!provider.has_api_key && (
                                        <Badge variant="outline">API key وارد نشده</Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {editingProvider === provider.id ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`api-key-${provider.id}`}>API Key</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id={`api-key-${provider.id}`}
                                                type={showApiKeys[provider.id] ? 'text' : 'password'}
                                                placeholder="API key را وارد کنید"
                                                value={apiKeys[provider.id] || ''}
                                                onChange={(e) => setApiKeys(prev => ({
                                                    ...prev,
                                                    [provider.id]: e.target.value
                                                }))}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleShowApiKey(provider.id)}
                                            >
                                                {showApiKeys[provider.id] ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleSaveProvider(provider.id, provider.provider_name)}
                                            disabled={saving[provider.id] || !apiKeys[provider.id]?.trim()}
                                            className="flex-1"
                                        >
                                            {saving[provider.id] && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            ذخیره و فعال کردن
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
                                        >
                                            انصراف
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {provider.has_api_key && !provider.is_active && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                                            <div className="flex items-center gap-2 text-yellow-800">
                                                <XCircle className="h-4 w-4" />
                                                <span>API key ذخیره شده است اما فعال نیست. می‌توانید آن را به صورت دستی فعال کنید.</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {provider.has_api_key && (
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={provider.is_active}
                                                        onCheckedChange={() => handleToggleProvider(provider.id, provider.is_active)}
                                                    />
                                                    <Label>
                                                        {provider.is_active ? 'فعال' : 'غیرفعال'}
                                                    </Label>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant={provider.has_api_key ? "outline" : "default"}
                                            onClick={() => handleEditProvider(provider)}
                                        >
                                            {provider.has_api_key ? 'تغییر API Key' : 'وارد کردن API Key'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

