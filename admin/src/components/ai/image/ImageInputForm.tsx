"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Textarea';
import { Checkbox } from '@/components/elements/Checkbox';
import { ProviderSelector } from '../shared/ProviderSelector';
import { AvailableProvider } from '@/api/ai/route';
import { Loader2, Sparkles, Wand2, Brain, AlertCircle } from 'lucide-react';
import { msg } from '@/core/messages/message';

interface ImageInputFormProps {
    providers: AvailableProvider[];
    selectedProvider: string;
    prompt: string;
    saveToDb: boolean;
    generating: boolean;
    loadingProviders: boolean;
    onSelectProvider: (providerName: string) => void;
    onPromptChange: (prompt: string) => void;
    onSaveToDbChange: (save: boolean) => void;
    onGenerate: () => void;
    compact?: boolean;
}

export function ImageInputForm({
    providers,
    selectedProvider,
    prompt,
    saveToDb,
    generating,
    loadingProviders,
    onSelectProvider,
    onPromptChange,
    onSaveToDbChange,
    onGenerate,
    compact = false,
}: ImageInputFormProps) {
    const cardClass = compact 
        ? "border border-br" 
        : "hover:shadow-lg transition-all duration-300 border-b-4 border-b-pink-1";
    
    const headerClass = compact ? "pb-2" : "pb-3";
    const titleClass = compact ? "text-base" : "";
    const iconSize = compact ? "w-4 h-4" : "w-5 h-5";
    const iconPadding = compact ? "p-1.5" : "p-2.5";
    
    return (
        <Card className={cardClass}>
            {!compact && (
                <CardHeader className={headerClass}>
                    <CardTitle className={`flex items-center gap-3 ${titleClass}`}>
                        <div className={`${iconPadding} bg-pink rounded-xl shadow-sm`}>
                            <Wand2 className={`${iconSize} stroke-pink-2`} />
                        </div>
                        تولید تصویر با AI
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent className={compact ? "space-y-3 pt-4" : "space-y-6"}>
                <div className="space-y-3">
                    <Label className={`flex items-center gap-2 ${compact ? 'text-sm' : 'text-base font-medium'}`}>
                        {!compact && <Brain className="w-4 h-4 text-font-s" />}
                        <span>{compact ? 'مدل AI:' : 'انتخاب مدل AI'}</span>
                    </Label>
                    <ProviderSelector
                        providers={providers}
                        selectedProvider={selectedProvider}
                        onSelectProvider={onSelectProvider}
                        type="image"
                        loading={loadingProviders}
                        compact={compact}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="prompt" className={compact ? "text-sm" : ""}>
                        توضیحات تصویر <span className="text-red-1">*</span>
                    </Label>
                    <Textarea
                        id="prompt"
                        placeholder="مثال: a beautiful cat, professional photography, high quality..."
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        rows={compact ? 3 : 4}
                        className="resize-none text-sm"
                    />
                    {!compact && (
                        <div className="flex items-start gap-2 text-xs text-font-s bg-blue border border-blue-1 rounded-lg p-2">
                            <AlertCircle className="h-4 w-4 text-blue-1 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-blue-2 mb-1">💡 نکته برای کیفیت بهتر:</p>
                                <p>برای نتیجه بهتر، توضیحات را به <strong>انگلیسی</strong> بنویسید. مثال: "a beautiful cat, high quality, detailed"</p>
                                <p className="mt-1 text-xs">سیستم به صورت خودکار کلمات کلیدی کیفیت را اضافه می‌کند.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`flex items-center gap-1 ${compact ? 'p-2' : 'p-3'} bg-blue border border-blue-1 rounded-lg`}>
                    <Checkbox
                        id="save-to-db"
                        checked={saveToDb}
                        onCheckedChange={(checked) => onSaveToDbChange(checked === true)}
                    />
                    <Label htmlFor="save-to-db" className={`${compact ? 'text-xs' : 'text-sm'} font-normal cursor-pointer`}>
                        {compact ? 'ذخیره خودکار' : 'ذخیره خودکار در دیتابیس (اگر خالی باشد، فقط نمایش داده می‌شود - سریع‌تر)'}
                    </Label>
                </div>

                <Button
                    onClick={onGenerate}
                    disabled={generating || !prompt.trim() || !selectedProvider}
                    className="w-full"
                    size={compact ? "default" : "lg"}
                >
                    {generating ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {compact ? 'در حال تولید...' : 'در حال تولید تصویر...'}
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            تولید تصویر
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

