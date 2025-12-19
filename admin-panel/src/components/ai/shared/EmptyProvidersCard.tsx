import { Card, CardContent } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Settings, Sparkles, Mic, FileText, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AIType = 'image' | 'audio' | 'content' | 'chat';

interface EmptyProvidersCardProps {
    type: AIType;
    onNavigateToSettings?: () => void;
}

const typeConfig: Record<AIType, { icon: LucideIcon; title: string; message: string }> = {
    image: {
        icon: Sparkles,
        title: 'هیچ مدل AI فعالی برای تولید تصویر وجود ندارد',
        message: 'برای تولید تصویر با AI، باید:',
    },
    audio: {
        icon: Mic,
        title: 'هیچ مدل AI فعالی برای تولید پادکست وجود ندارد',
        message: 'برای تولید پادکست با AI، باید:',
    },
    content: {
        icon: FileText,
        title: 'هیچ Provider فعالی یافت نشد',
        message: 'برای تولید محتوا با AI، باید:',
    },
    chat: {
        icon: MessageSquare,
        title: 'هیچ مدل AI فعالی برای چت وجود ندارد',
        message: 'برای چت با AI، باید:',
    },
};

export function EmptyProvidersCard({ type, onNavigateToSettings }: EmptyProvidersCardProps) {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <Card>
            <CardContent className="py-8">
                <div className="text-center space-y-4">
                    <Icon className="h-12 w-12 mx-auto text-font-s mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
                    <div className="space-y-2 text-sm text-font-s">
                        <p>{config.message}</p>
                        {onNavigateToSettings && (
                            <div className="mt-6">
                                <Button 
                                    onClick={onNavigateToSettings}
                                    variant="default"
                                    className="gap-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    رفتن به تنظیمات AI
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
