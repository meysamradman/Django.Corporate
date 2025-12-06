"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Textarea';
import { ProviderSelector } from '../shared/ProviderSelector';
import { AvailableProvider } from '@/types/ai/ai';
import { Loader2, Sparkles, Brain, Type } from 'lucide-react';
import { getAI, getAIUI } from '@/core/messages/modules/ai';

interface ContentInputFormProps {
    providers: AvailableProvider[];
    selectedProvider: string;
    topic: string;
    generating: boolean;
    loadingProviders: boolean;
    onSelectProvider: (providerName: string) => void;
    onTopicChange: (topic: string) => void;
    onGenerate: () => void;
}

export function ContentInputForm({
    providers,
    selectedProvider,
    topic,
    generating,
    loadingProviders,
    onSelectProvider,
    onTopicChange,
    onGenerate,
}: ContentInputFormProps) {
    return (
        <CardWithIcon
            icon={Sparkles}
            title="تولید محتوای SEO با AI"
            iconBgColor="bg-pink"
            iconColor="stroke-pink-2"
            borderColor="border-b-pink-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3"
        >
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base font-medium">
                            <Brain className="w-4 h-4 text-font-s" />
                            {msg.aiUI('selectModel')}
                        </Label>
                        <ProviderSelector
                            providers={providers}
                            selectedProvider={selectedProvider}
                            onSelectProvider={onSelectProvider}
                            type="content"
                            loading={loadingProviders}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="topic" className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-font-s" />
                            {msg.aiUI('contentTopic')} <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="topic"
                            placeholder={msg.aiUI('topicPlaceholder')}
                            value={topic}
                            onChange={(e) => onTopicChange(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <Button
                        onClick={onGenerate}
                        disabled={generating || !topic.trim() || !selectedProvider}
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                {msg.aiUI('generatingContent')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                {msg.aiUI('generateContent')}
                            </>
                        )}
                    </Button>
                </div>
        </CardWithIcon>
    );
}

