import { Button } from '@/components/elements/Button';
import { RotateCcw } from 'lucide-react';

interface MediaPlayerErrorStateProps {
    onRetry: () => void;
}

export function MediaPlayerErrorState({ onRetry }: MediaPlayerErrorStateProps) {
    return (
        <div className="text-center text-font-s">
            <p>خطا در بارگذاری رسانه</p>
            <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-4"
            >
                <RotateCcw className="h-4 w-4 ml-2" />
                تلاش مجدد
            </Button>
        </div>
    );
}