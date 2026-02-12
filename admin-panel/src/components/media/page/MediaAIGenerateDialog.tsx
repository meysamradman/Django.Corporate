import { Suspense } from 'react';
import type { Media } from '@/types/shared/media';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/elements/Dialog';
import { Loader } from '@/components/elements/Loader';

interface AIImageGeneratorProps {
    compact: boolean;
    onImageGenerated: () => void;
    onSelectGenerated: (media: Media) => void;
    onNavigateToSettings: () => void;
}

interface MediaAIGenerateDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onImageGenerated: () => void;
    onSelectGenerated: (media: Media) => void;
    onNavigateToSettings: () => void;
    AIImageGeneratorComponent: React.ComponentType<AIImageGeneratorProps>;
}

export function MediaAIGenerateDialog({
    isOpen,
    onOpenChange,
    onImageGenerated,
    onSelectGenerated,
    onNavigateToSettings,
    AIImageGeneratorComponent,
}: MediaAIGenerateDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>تولید تصویر با AI</DialogTitle>
                </DialogHeader>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader /></div>}>
                    <AIImageGeneratorComponent
                        compact={true}
                        onImageGenerated={onImageGenerated}
                        onSelectGenerated={onSelectGenerated}
                        onNavigateToSettings={onNavigateToSettings}
                    />
                </Suspense>
            </DialogContent>
        </Dialog>
    );
}