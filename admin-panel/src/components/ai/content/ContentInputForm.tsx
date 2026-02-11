import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Textarea';
import { Loader2, Sparkles, Type } from 'lucide-react';
import { msg } from '@/core/messages';
import { ProviderSelector } from '../shared/ProviderSelector';
import type { AvailableProvider } from '@/types/ai/ai';

interface ContentInputFormProps {
    providers: AvailableProvider[];
    selectedProvider: string;
    loadingProviders: boolean;
    onSelectProvider: (providerName: string) => void;
    destinations: { key: string; label: string }[];
    destination: string;
    topic: string;
    generating: boolean;
    onDestinationChange: (destination: string) => void;
    onTopicChange: (topic: string) => void;
    onGenerate: () => void;
}

export function ContentInputForm({
    providers,
    selectedProvider,
    loadingProviders,
    onSelectProvider,
    destinations,
    destination,
    topic,
    generating,
    onDestinationChange,
    onTopicChange,
    onGenerate,
}: ContentInputFormProps) {
    return (
        <CardWithIcon
            icon={Sparkles}
            title="تولید محتوای SEO با AI"
            iconBgColor="bg-pink"
            iconColor="stroke-pink-2"
            cardBorderColor="border-b-pink-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3"
        >
            <div className="space-y-6">
                <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-medium">
                        انتخاب Provider
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
                    <Label className="flex items-center gap-2 text-base font-medium">
                        <span className="w-4 h-4 text-font-s" />
                        ذخیره در
                    </Label>
                    <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={destination}
                        onChange={(e) => onDestinationChange(e.target.value)}
                    >
                        <option value="none">فقط نمایش (ذخیره نشود)</option>
                        {destinations.map((dest) => (
                            <option key={dest.key} value={dest.key}>
                                {dest.label}
                            </option>
                        ))}
                    </select>
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
                    disabled={generating || !topic.trim()}
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

