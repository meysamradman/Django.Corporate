"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Textarea';
import { Checkbox } from '@/components/elements/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/elements/Select';
import { ProviderSelector } from '../shared/ProviderSelector';
import { AvailableProvider } from '@/types/ai/ai';
import { Loader2, Sparkles, Brain, Mic, Volume2, AlertCircle } from 'lucide-react';
import { msg } from '@/core/messages/message';

interface AudioInputFormProps {
    providers: AvailableProvider[];
    selectedProvider: string;
    text: string;
    model: string;
    voice: string;
    speed: number;
    saveToDb: boolean;
    generating: boolean;
    loadingProviders: boolean;
    onSelectProvider: (providerName: string) => void;
    onTextChange: (text: string) => void;
    onModelChange: (model: string) => void;
    onVoiceChange: (voice: string) => void;
    onSpeedChange: (speed: number) => void;
    onSaveToDbChange: (save: boolean) => void;
    onGenerate: () => void;
    compact?: boolean;
}

const VOICE_OPTIONS = [
    { value: 'alloy', label: 'Alloy' },
    { value: 'echo', label: 'Echo' },
    { value: 'fable', label: 'Fable' },
    { value: 'onyx', label: 'Onyx' },
    { value: 'nova', label: 'Nova' },
    { value: 'shimmer', label: 'Shimmer' },
];

export function AudioInputForm({
    providers,
    selectedProvider,
    text,
    model,
    voice,
    speed,
    saveToDb,
    generating,
    loadingProviders,
    onSelectProvider,
    onTextChange,
    onModelChange,
    onVoiceChange,
    onSpeedChange,
    onSaveToDbChange,
    onGenerate,
    compact = false,
}: AudioInputFormProps) {
    const cardClass = compact 
        ? "border" 
        : "hover:shadow-lg transition-all duration-300 border-b-4 border-b-purple-1";
    
    const headerClass = compact ? "pb-2" : "pb-3";
    const titleClass = compact ? "text-base" : "";
    const iconSize = compact ? "w-4 h-4" : "w-5 h-5";
    const iconPadding = compact ? "p-1.5" : "p-2.5";
    
    return (
        <Card className={cardClass}>
            {!compact && (
                <CardHeader className={headerClass}>
                    <CardTitle className={`flex items-center gap-3 ${titleClass}`}>
                        <div className={`${iconPadding} bg-purple rounded-xl shadow-sm`}>
                            <Mic className={`${iconSize} stroke-purple-2`} />
                        </div>
                        تولید پادکست با AI
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
                        type="content"
                        loading={loadingProviders}
                        compact={compact}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="text" className={compact ? "text-sm" : ""}>
                        متن برای تبدیل به صدا <span className="text-red-1">*</span>
                    </Label>
                    <Textarea
                        id="text"
                        placeholder="متن خود را وارد کنید... (حداکثر 4096 کاراکتر)"
                        value={text}
                        onChange={(e) => onTextChange(e.target.value)}
                        rows={compact ? 4 : 6}
                        className="resize-none text-sm"
                        maxLength={4096}
                    />
                    <div className="flex items-center justify-between text-xs text-font-s">
                        <span>{text.length} / 4096 کاراکتر</span>
                        {text.length > 0 && (
                            <span className="text-purple-1">
                                ≈ {Math.ceil(text.length / 200)} دقیقه صدا
                            </span>
                        )}
                    </div>
                </div>

                {/* تنظیمات صدا */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="model" className="text-sm flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-font-s" />
                            مدل
                        </Label>
                        <Select value={model} onValueChange={onModelChange}>
                            <SelectTrigger id="model">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tts-1">TTS-1 (سریع)</SelectItem>
                                <SelectItem value="tts-1-hd">TTS-1-HD (کیفیت بالا)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="voice" className="text-sm flex items-center gap-2">
                            <Mic className="w-4 h-4 text-font-s" />
                            صدا
                        </Label>
                        <Select value={voice} onValueChange={onVoiceChange}>
                            <SelectTrigger id="voice">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {VOICE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="speed" className="text-sm">
                            سرعت: {speed}x
                        </Label>
                        <input
                            id="speed"
                            type="range"
                            min="0.25"
                            max="4.0"
                            step="0.25"
                            value={speed}
                            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-br rounded-lg appearance-none cursor-pointer accent-purple-1"
                        />
                        <div className="flex justify-between text-xs text-font-s">
                            <span>0.25x</span>
                            <span>1.0x</span>
                            <span>4.0x</span>
                        </div>
                    </div>
                </div>

                {!compact && (
                    <div className="flex items-start gap-2 text-xs text-font-s bg-purple/10 border border-purple-1 rounded-lg p-3">
                        <AlertCircle className="h-4 w-4 text-purple-1 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-purple-2 mb-1">💡 نکته:</p>
                            <p>متن می‌تواند به فارسی یا انگلیسی باشد. OpenAI TTS از هر دو زبان پشتیبانی می‌کند.</p>
                        </div>
                    </div>
                )}

                <div className={`flex items-center gap-1 ${compact ? 'p-2' : 'p-3'} bg-blue/10 border border-blue-1 rounded-lg`}>
                    <Checkbox
                        id="save-to-db-audio"
                        checked={saveToDb}
                        onCheckedChange={(checked) => onSaveToDbChange(checked === true)}
                    />
                    <Label htmlFor="save-to-db-audio" className={`${compact ? 'text-xs' : 'text-sm'} font-normal cursor-pointer`}>
                        {compact ? 'ذخیره خودکار' : 'ذخیره خودکار در دیتابیس (اگر خالی باشد، فقط نمایش داده می‌شود - سریع‌تر)'}
                    </Label>
                </div>

                <Button
                    onClick={onGenerate}
                    disabled={generating || !text.trim() || !selectedProvider}
                    className="w-full"
                    size={compact ? "default" : "lg"}
                >
                    {generating ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {compact ? 'در حال تولید...' : 'در حال تولید پادکست...'}
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            تولید پادکست
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

