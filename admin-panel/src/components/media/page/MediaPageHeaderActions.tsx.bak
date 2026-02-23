import { ProtectedButton } from '@/core/permissions';
import { Upload, Sparkles } from 'lucide-react';

interface MediaPageHeaderActionsProps {
    onAIGenerateClick: () => void;
    onUploadClick: () => void;
}

export function MediaPageHeaderActions({ onAIGenerateClick, onUploadClick }: MediaPageHeaderActionsProps) {
    return (
        <>
            <ProtectedButton
                permission="ai.create"
                size="sm"
                className="border border-pink-1 bg-pink text-pink-2 shadow-sm transition hover:bg-pink/90"
                onClick={onAIGenerateClick}
                showDenyToast={false}
            >
                <Sparkles className="h-4 w-4" />
                تولید با AI
            </ProtectedButton>

            <ProtectedButton
                permission={['media.upload', 'media.image.upload', 'media.video.upload', 'media.audio.upload', 'media.document.upload']}
                requireAll={false}
                size="sm"
                className="bg-primary text-static-w shadow-sm hover:shadow-md"
                onClick={onUploadClick}
                showDenyToast={false}
            >
                <Upload className="h-4 w-4" />
                آپلود رسانه
            </ProtectedButton>
        </>
    );
}